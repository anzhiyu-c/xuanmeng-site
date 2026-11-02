#!/usr/bin/env python3
"""把 art/raw 下的原图转成站点用的 webp，输出到 public/img。

已是透明底的直接用；还带着洋红底的走 Codex 自带的抠图脚本。
可重复运行，只处理比输出新的文件。
"""
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'art/raw'
OUT = ROOT / 'public/img'
HELPER = Path(os.environ.get('CODEX_HOME', Path.home() / '.codex')) / 'skills/.system/imagegen/scripts/remove_chroma_key.py'
KEYED = ROOT / 'art/raw/keyed'


def has_alpha(im):
    if im.mode != 'RGBA':
        return False
    return im.getchannel('A').getextrema()[0] < 16


def clean_alpha(im: Image.Image) -> Image.Image:
    """生成图的背景残留 1~15 的透明度，叠投影后会显脏。低于 16 归零，其余线性拉回满量程。"""
    im = im.convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 16 else min(255, round((v - 16) * 255 / 224))))
    return im


def cutout(src: Path) -> Image.Image:
    im = Image.open(src)
    if has_alpha(im):
        return clean_alpha(im)
    KEYED.mkdir(exist_ok=True)
    out = KEYED / src.name
    if not out.exists() or out.stat().st_mtime < src.stat().st_mtime:
        out.unlink(missing_ok=True)
        subprocess.run(
            [sys.executable, str(HELPER), '--input', str(src), '--out', str(out), '--auto-key', 'border', '--soft-matte',
             '--transparent-threshold', '12', '--opaque-threshold', '220', '--despill'],
            check=True, stdout=subprocess.DEVNULL,
        )
    return clean_alpha(Image.open(out))


def fit(im, long_side=None, width=None):
    w, h = im.size
    if width:
        scale = width / w
    elif long_side:
        scale = long_side / max(w, h)
    else:
        return im
    size = (round(w * scale), round(h * scale))
    res = im.resize(size, Image.LANCZOS)
    if scale > 1:
        # 放大后补一点锐度，矿物颜料的笔触才不会糊
        res = res.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    return res


def save(im, rel, quality=84):
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    if im.mode == 'RGBA':
        im.save(path, 'WEBP', quality=quality, alpha_quality=92, method=6)
    else:
        im.convert('RGB').save(path, 'WEBP', quality=quality, method=6)
    return path.stat().st_size // 1024


def fresh(src: Path, rel: str):
    dst = OUT / rel
    return dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime


def trim(im):
    box = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    return im.crop(box) if box else im


# 头部中心（占图宽、图高的比例）与取景大小（占图高的比例），对照立绘逐张标定
FACES = {
    '偃无师': (.475, .083, .16), '剑侠客': (.65, .15, .16), '巨魔王': (.5, .167, .19), '巫蛮儿': (.5, .115, .16),
    '杀破狼': (.45, .233, .16), '桃夭夭': (.5, .165, .16), '狐美人': (.485, .15, .16), '玄彩娥': (.5, .13, .16),
    '神天兵': (.49, .185, .17), '羽灵神': (.515, .12, .16), '舞天姬': (.435, .215, .16), '英女侠': (.515, .117, .16),
    '虎头怪': (.44, .165, .2), '逍遥生': (.475, .13, .16), '飞燕女': (.65, .165, .16), '骨精灵': (.56, .13, .16),
    '鬼潇潇': (.5, .165, .16), '龙太子': (.525, .215, .16),
}


def face_thumb(im, name, size=132):
    cx, cy, k = FACES[name]
    side = int(im.height * k)
    left = int(cx * im.width - side / 2)
    top = int(cy * im.height - side / 2)
    crop = im.crop((left, top, left + side, top + side)).resize((size, size), Image.LANCZOS)
    bg = Image.new('RGBA', crop.size, (14, 34, 64, 255))
    bg.alpha_composite(crop)
    return bg.convert('RGB')


# 图集不是严格网格，这里是每件武器在 1536×1024 原图上的位置
WEAPON_BOXES = {
    '剑': (85, 5, 185, 345), '刀': (295, 5, 435, 345), '枪矛': (555, 5, 710, 345), '斧钺': (725, 5, 895, 345),
    '锤': (980, 5, 1170, 345), '扇': (1215, 5, 1515, 345), '环圈': (20, 345, 300, 660), '双剑': (330, 345, 500, 660),
    '鞭': (555, 345, 775, 650), '爪刺': (820, 345, 995, 640), '法杖': (1140, 330, 1225, 665), '魔棒': (1385, 340, 1450, 650),
    '飘带': (20, 655, 310, 1000), '弓弩': (360, 640, 490, 1010), '宝珠': (570, 710, 775, 930), '巨剑': (865, 645, 980, 985),
    '伞': (1005, 670, 1315, 1005), '灯笼': (1350, 640, 1490, 1000),
}


def drop_specks(im, keep=0.03):
    """去掉面积不足最大连通块 keep 比例的碎屑（相邻武器混进来的边角）。"""
    k = 3
    small = im.getchannel('A').resize((im.width // k, im.height // k), Image.BILINEAR).point(lambda v: 255 if v > 40 else 0)
    w, h = small.size
    px = small.load()
    label = [[0] * w for _ in range(h)]
    sizes = {}
    cur = 0
    for y in range(h):
        for x in range(w):
            if px[x, y] and not label[y][x]:
                cur += 1
                label[y][x] = cur
                stack = [(x, y)]
                n = 0
                while stack:
                    a, b = stack.pop()
                    n += 1
                    for na, nb in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                        if 0 <= na < w and 0 <= nb < h and px[na, nb] and not label[nb][na]:
                            label[nb][na] = cur
                            stack.append((na, nb))
                sizes[cur] = n
    if not sizes:
        return im
    biggest = max(sizes.values())
    small_ids = {i for i, n in sizes.items() if n < biggest * keep}
    if not small_ids:
        return im
    mask = Image.new('L', (w, h), 255)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if label[y][x] in small_ids:
                mp[x, y] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).resize(im.size, Image.NEAREST)
    out = im.copy()
    out.putalpha(Image.composite(im.getchannel('A'), Image.new('L', im.size, 0), mask))
    return out


def main():
    report = []

    for name, opaque in [('xian_far', True), ('xian_mid', False), ('xian_near', False), ('ren_far', True), ('ren_mid', False),
                         ('ren_near', False), ('mo_far', True), ('mo_mid', False), ('mo_near', False)]:
        src = RAW / f'{name}.png'
        rel = f'scene/{name}.webp'
        if not src.exists() or fresh(src, rel):
            continue
        im = Image.open(src).convert('RGB') if opaque else cutout(src)
        report.append((rel, save(fit(im, width=2200 if opaque else 2048), rel, 80 if opaque else 82)))

    for name in ['cloud_light', 'cloud_dark']:
        src = RAW / f'{name}.png'
        rel = f'scene/{name}.webp'
        if src.exists() and not fresh(src, rel):
            report.append((rel, save(fit(cutout(src), width=2000), rel, 80)))

    src = RAW / 'gate.png'
    if src.exists() and not fresh(src, 'scene/gate.webp'):
        report.append(('scene/gate.webp', save(fit(Image.open(src).convert('RGB'), width=2200), 'scene/gate.webp', 80)))

    src = RAW / 'silk.png'
    if src.exists() and not fresh(src, 'silk.webp'):
        # 镜像成 2×2 无缝贴图，并提亮减饱和，绢色才清雅
        base = fit(Image.open(src).convert('RGB'), width=800)
        base = ImageEnhance.Color(ImageEnhance.Brightness(base).enhance(1.2)).enhance(0.72)
        w, h = base.size
        tile = Image.new('RGB', (w * 2, h * 2))
        tile.paste(base, (0, 0))
        tile.paste(ImageOps.mirror(base), (w, 0))
        tile.paste(ImageOps.flip(base), (0, h))
        tile.paste(ImageOps.flip(ImageOps.mirror(base)), (w, h))
        report.append(('silk.webp', save(tile, 'silk.webp', 72)))

    for src in sorted(RAW.glob('jinyi_*.png')):
        rel = f'jinyi/{src.stem[6:]}.webp'
        if not fresh(src, rel):
            report.append((rel, save(fit(cutout(src), long_side=900), rel, 80)))

    # 分享图与站点图标
    src = RAW / 'test_hero.png'
    if src.exists() and not fresh(src, 'og_cover.jpg'):
        Image.open(src).convert('RGB').resize((1200, 675), Image.LANCZOS).save(OUT / 'og_cover.jpg', quality=84)
    logo = RAW / 'logo_hi.png'
    if logo.exists() and not (ROOT / 'public/favicon-32.png').exists():
        mark = trim(cutout(logo))
        mark.resize((32, 32), Image.LANCZOS).save(ROOT / 'public/favicon-32.png')
        mark.resize((180, 180), Image.LANCZOS).save(ROOT / 'public/apple-touch-icon.png')

    for src in sorted(RAW.glob('role_*.png')):
        name = src.stem[5:]
        rel = f'role/{name}.webp'
        if fresh(src, rel):
            continue
        im = cutout(src)
        report.append((rel, save(fit(im, long_side=1536), rel, 84)))
        save(face_thumb(im, name), f'role/thumb/{name}.webp', 82)

    for src in sorted(RAW.glob('sect_*.png')):
        name = src.stem[5:]
        rel = f'sect/{name}.webp'
        if fresh(src, rel):
            continue
        report.append((rel, save(fit(Image.open(src).convert('RGB'), long_side=1000), rel, 80)))

    for src in sorted(RAW.glob('feat_*.png')):
        rel = f'feat/{src.stem[5:]}.webp'
        if fresh(src, rel):
            continue
        report.append((rel, save(fit(Image.open(src).convert('RGB'), long_side=1500), rel, 78)))

    for src in sorted(RAW.glob('map_*.png')):
        rel = f'map/{src.stem[4:]}.webp'
        if fresh(src, rel):
            continue
        report.append((rel, save(fit(Image.open(src).convert('RGB'), long_side=1600), rel, 80)))

    for src in sorted(list(RAW.glob('qinghua_*.png')) + list(RAW.glob('yunmo_*.png'))):
        rel = f'pet/{src.stem}.webp'
        if fresh(src, rel):
            continue
        report.append((rel, save(fit(cutout(src), long_side=1000), rel, 82)))

    src = RAW / 'logo_hi.png'
    if not src.exists():
        src = RAW / 'logo_src.png'
    if not fresh(src, 'logo-mark.webp'):
        im = trim(cutout(src))
        report.append(('logo-mark.webp', save(fit(im, long_side=256), 'logo-mark.webp', 90)))
        report.append(('scene/title.webp', save(fit(im, long_side=1000), 'scene/title.webp', 84)))

    # 武器图鉴：6×3 的图集切开
    src = RAW / 'weapons.png'
    if src.exists() and not fresh(src, 'weapon/剑.webp'):
        sheet = cutout(src)
        k = sheet.width / 1536
        for n, box in WEAPON_BOXES.items():
            save(trim(drop_specks(sheet.crop(tuple(round(v * k) for v in box)))), f'weapon/{n}.webp', 84)
        report.append(('weapon/*', 0))

    # 走马灯、列表用的小图，避免一屏同时下载十几张原图
    for folder, size, q in [('role', 760, 72), ('sect', 480, 72), ('pet', 480, 72)]:
        for src in sorted((OUT / folder).glob('*.webp')):
            rel = f'{folder}/small/{src.name}'
            if not fresh(src, rel):
                im = Image.open(src)
                save(fit(im.convert('RGBA') if im.mode == 'RGBA' else im.convert('RGB'), long_side=size), rel, q)

    # 手机版场景：同一批图缩到 1200 宽
    for src in sorted((OUT / 'scene').glob('*.webp')):
        if src.stem in ('title', 'gate'):
            continue
        rel = f'scene/m/{src.name}'
        if not fresh(src, rel):
            im = Image.open(src)
            report.append((rel, save(fit(im.convert('RGBA') if im.mode == 'RGBA' else im.convert('RGB'), width=1200), rel, 72)))

    total = 0
    for rel, kb in report:
        total += kb
        print(f'{kb:>6} KB  {rel}')
    print(f'共 {len(report)} 个，{total/1024:.1f} MB')


if __name__ == '__main__':
    main()
