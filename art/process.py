#!/usr/bin/env python3
"""把 art/raw 下的原图转成站点用的 webp，输出到 public/img。

已是透明底的直接用；还带着洋红底的走 Codex 自带的抠图脚本。
可重复运行，只处理比输出新的文件。
"""
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'art/raw'
OUT = ROOT / 'public/img'
HELPER = Path(os.environ.get('CODEX_HOME', Path.home() / '.codex')) / 'skills/.system/imagegen/scripts/remove_chroma_key.py'
KEYED = ROOT / 'art/raw/keyed'
# 当前选用的标题款式，对应 art/raw/logo_<款式>.png
LOGO = os.environ.get('XM_LOGO', 'royal')


def has_alpha(im):
    if im.mode != 'RGBA':
        return False
    return im.getchannel('A').getextrema()[0] < 16


def clean_alpha(im: Image.Image) -> Image.Image:
    """生成图常带一圈半透明光晕，放到亮色背景上会发脏。低于 LOW 归零，其余线性拉回满量程。"""
    LOW = 40
    im = im.convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda v: 0 if v < LOW else min(255, round((v - LOW) * 255 / (240 - LOW)))))
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
            # 底色固定是洋红。不能从边缘取色：前景图的屋檐和柳枝贴着边，取到的就不是底色了
            [sys.executable, str(HELPER), '--input', str(src), '--out', str(out), '--auto-key', 'none', '--key-color', '#ff00ff', '--soft-matte',
             '--transparent-threshold', '12', '--opaque-threshold', '220', '--despill'],
            check=True, stdout=subprocess.DEVNULL,
        )
    keyed = Image.open(out).convert('RGBA')
    check_keyed(keyed, src.name)
    return clean_alpha(keyed)


def check_keyed(im, name):
    """抠图失败时整张底色都还在，放到网站上就是满屏洋红，这里直接报错。"""
    small = im.copy()
    small.thumbnail((200, 200))
    px = list(small.get_flattened_data())
    left = sum(1 for r, g, b, a in px if a > 200 and r > 190 and b > 190 and g < 90) / len(px)
    if left > 0.005:
        raise SystemExit(f'{name} 抠图失败：还有 {left:.1%} 的不透明洋红')


def defringe(im, soft_only=False):
    """抠洋红底时，云雾这类半透明处会残留紫边。把红蓝里高出绿色的部分减掉，紫就回到中性色。
    soft_only 只处理半透明像素，用于画面本身带暗红的魔界。"""
    r, g, b, a = im.convert('RGBA').split()
    excess = ImageChops.subtract(ImageChops.darker(r, b), g)
    if soft_only:
        excess = ImageChops.multiply(excess, a.point(lambda v: 255 if v < 250 else 0))
    return Image.merge('RGBA', (ImageChops.subtract(r, excess), g, ImageChops.subtract(b, excess), a))


def navy_logo(im):
    """标题的紫色收成全站的深靛蓝，金边不动。"""
    a = im.getchannel('A')
    h, sat, v = im.convert('RGB').convert('HSV').split()
    # PIL 的色相是 0~255：紫到品红约在 165~225，统一转到靛蓝 165
    purple = h.point(lambda x: 255 if 165 <= x <= 225 else 0)
    h = Image.composite(Image.new('L', im.size, 165), h, purple)
    sat = Image.composite(sat.point(lambda x: round(x * 0.82)), sat, purple)
    v = Image.composite(v.point(lambda x: round(x * 0.74)), v, purple)
    out = Image.merge('HSV', (h, sat, v)).convert('RGBA')
    out.putalpha(a)
    return out


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
        # 放大后补一点锐度，线条才不会糊
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
    '偃无师': (.54, .24, .3), '剑侠客': (.56, .33, .32), '巨魔王': (.525, .33, .27), '巫蛮儿': (.525, .35, .3),
    '桃夭夭': (.525, .35, .3), '狐美人': (.55, .33, .28), '玄彩娥': (.55, .35, .28), '神天兵': (.535, .39, .28),
    '羽灵神': (.5, .29, .26), '舞天姬': (.525, .34, .26), '虎头怪': (.475, .36, .26), '逍遥生': (.54, .32, .28),
    '飞燕女': (.525, .36, .3), '骨精灵': (.5, .32, .28), '鬼潇潇': (.5, .34, .26), '龙太子': (.525, .34, .28),
}
FACE_DEFAULT = (.5, .33, .28)


def face_thumb(im, name, size=132):
    cx, cy, k = FACES.get(name, FACE_DEFAULT)
    side = int(im.height * k)
    left = int(cx * im.width - side / 2)
    top = int(cy * im.height - side / 2)
    crop = im.crop((left, top, left + side, top + side)).resize((size, size), Image.LANCZOS)
    bg = Image.new('RGBA', crop.size, (236, 242, 255, 255))
    bg.alpha_composite(crop)
    return bg.convert('RGB')


# 图集从左到右、从上到下的顺序，和 manifest 里的提示词一致
WEAPONS = ['剑', '刀', '枪矛', '斧钺', '锤', '扇', '环圈', '双剑', '鞭', '爪刺', '法杖', '魔棒', '飘带', '弓弩', '宝珠', '巨剑', '伞', '灯笼']


def weapon_slices(sheet):
    """把图集切成 18 件。先找出所有连通块，按中心点落在 6×3 的哪一格归类（双剑这种两块的归到同一件），
    再只保留属于这一格的像素，邻居伸过来的边角不会混进来。"""
    k = 3
    mask = sheet.getchannel('A').resize((sheet.width // k, sheet.height // k), Image.BILINEAR).point(lambda v: 255 if v > 40 else 0)
    w, h = mask.size
    px = mask.load()
    seen = [[False] * w for _ in range(h)]
    cells = {}
    for y in range(h):
        for x in range(w):
            if not px[x, y] or seen[y][x]:
                continue
            seen[y][x] = True
            stack = [(x, y)]
            points = []
            while stack:
                a, b = stack.pop()
                points.append((a, b))
                for na, nb in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                    if 0 <= na < w and 0 <= nb < h and px[na, nb] and not seen[nb][na]:
                        seen[nb][na] = True
                        stack.append((na, nb))
            if len(points) < 30:
                continue
            cx = sum(p[0] for p in points) / len(points)
            cy = sum(p[1] for p in points) / len(points)
            cells.setdefault((min(2, int(cy * 3 / h)), min(5, int(cx * 6 / w))), []).append(points)
    if len(cells) != len(WEAPONS):
        raise SystemExit(f'武器图集切分失败：应有 {len(WEAPONS)} 格，实际 {len(cells)} 格')
    out = {}
    for name, key in zip(WEAPONS, sorted(cells)):
        keep = Image.new('L', mask.size, 0)
        kp = keep.load()
        for points in cells[key]:
            for a, b in points:
                kp[a, b] = 255
        keep = keep.filter(ImageFilter.MaxFilter(5)).resize(sheet.size, Image.NEAREST)
        piece = sheet.copy()
        piece.putalpha(ImageChops.darker(sheet.getchannel('A'), keep))
        out[name] = trim(piece)
    return out


def main():
    report = []

    for name, opaque in [('xian_far', True), ('xian_mid', False), ('xian_near', False), ('ren_far', True), ('ren_mid', False),
                         ('ren_near', False), ('mo_far', True), ('mo_mid', False), ('mo_near', False)]:
        src = RAW / f'{name}.png'
        rel = f'scene/{name}.webp'
        if not src.exists() or fresh(src, rel):
            continue
        im = Image.open(src).convert('RGB') if opaque else defringe(cutout(src), soft_only=name.startswith('mo_'))
        report.append((rel, save(fit(im, width=2200 if opaque else 2048), rel, 80 if opaque else 82)))

    src = RAW / 'cloud_band.png'
    if src.exists() and not fresh(src, 'scene/cloud_band.webp'):
        report.append(('scene/cloud_band.webp', save(fit(defringe(cutout(src)), width=2000), 'scene/cloud_band.webp', 80)))

    src = RAW / 'gate.png'
    if src.exists() and not fresh(src, 'scene/gate.webp'):
        report.append(('scene/gate.webp', save(fit(Image.open(src).convert('RGB'), width=2200), 'scene/gate.webp', 80)))

    for src in sorted(RAW.glob('jinyi_*.png')):
        rel = f'jinyi/{src.stem[6:]}.webp'
        if not fresh(src, rel):
            report.append((rel, save(fit(cutout(src), long_side=900), rel, 80)))

    # 站点图标：把标题放进方形画布，长边撑满
    logo = RAW / f'logo_{LOGO}.png'
    if logo.exists() and not fresh(logo, 'logo-mark.webp'):
        mark = navy_logo(trim(cutout(logo)))
        side = max(mark.size)
        square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        square.alpha_composite(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
        square.resize((32, 32), Image.LANCZOS).save(ROOT / 'public/favicon-32.png')
        square.resize((180, 180), Image.LANCZOS).save(ROOT / 'public/apple-touch-icon.png')

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

    src = RAW / f'logo_{LOGO}.png'
    if src.exists() and not fresh(src, 'logo-mark.webp'):
        im = navy_logo(trim(cutout(src)))
        report.append(('logo-mark.webp', save(fit(im, long_side=256), 'logo-mark.webp', 90)))
        report.append(('scene/title.webp', save(fit(im, long_side=1200), 'scene/title.webp', 86)))

    # 武器图鉴：6×3 的图集切开
    src = RAW / 'weapons.png'
    if src.exists() and not fresh(src, 'weapon/剑.webp'):
        for n, piece in weapon_slices(cutout(src)).items():
            save(piece, f'weapon/{n}.webp', 84)
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
