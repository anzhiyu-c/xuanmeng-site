#!/usr/bin/env python3
"""素材体检，分两部分：
1. 原图：透明底素材是否被画布切边（不透明像素贴着图片边缘连成一段）。
2. 站内图片 public/img：能否解码、数量是否齐、抠图是否成功（透明区、残留洋红、大片死黑）。

用法：python3 art/audit.py            只报告，有问题时退出码为 1
      python3 art/audit.py --delete  同时删掉切边的原图，下次 gen.mjs 会重画
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'art/raw'
OUT = ROOT / 'public/img'
# 贴边超过这个长度（占该边的比例）才算切边，零星飘带碎屑不算
LIMIT = 0.012


def edge_runs(alpha):
    w, h = alpha.size
    px = alpha.load()
    res = {}
    for name, n, get in (
        ('上', w, lambda i: px[i, 0]),
        ('下', w, lambda i: px[i, h - 1]),
        ('左', h, lambda i: px[0, i]),
        ('右', h, lambda i: px[w - 1, i]),
    ):
        best = cur = 0
        for i in range(n):
            if get(i) > 40:
                cur += 1
                best = max(best, cur)
            else:
                cur = 0
        if best / n > LIMIT:
            res[name] = round(best / n * 100)
    return res


# 文件夹、数量、是否应当透明。立绘和灵兽本身可能有洋红的头发和衣服，残留洋红的门槛放宽
SITE = [
    ('role', 18, True), ('role/small', 18, True), ('role/thumb', 18, False), ('jinyi', 6, True),
    ('pet', 22, True), ('pet/small', 22, True), ('weapon', 18, True),
    ('sect', 16, False), ('sect/small', 16, False), ('feat', 8, False), ('map', 4, False),
]
SCENE_CUT = ['xian_mid', 'xian_near', 'ren_mid', 'ren_near', 'mo_mid', 'mo_near', 'cloud_band']
SCENE_FULL = ['xian_far', 'ren_far', 'mo_far']


def inspect(path, cut, magenta_limit):
    """返回这张图的问题列表。"""
    try:
        im = Image.open(path)
        im.load()
    except Exception as e:
        return [f'无法解码 {e}']
    problems = []
    if path.stat().st_size < 2048:
        problems.append(f'文件过小 {path.stat().st_size}B')
    rgba = im.convert('RGBA')
    small = rgba.copy()
    small.thumbnail((240, 240))
    px = list(small.get_flattened_data())
    n = len(px)
    solid = [p for p in px if p[3] > 200]
    clear = sum(1 for p in px if p[3] < 16) / n
    if cut and clear < 0.03:
        problems.append(f'应为透明底，但透明区只有 {clear:.1%}')
    if not cut and clear > 0.01:
        problems.append(f'不应透明，却有 {clear:.1%} 透明')
    if solid:
        magenta = sum(1 for r, g, b, a in solid if r > 190 and b > 190 and g < 90) / len(solid)
        if magenta > magenta_limit:
            problems.append(f'残留洋红 {magenta:.1%}')
        # 抠图失败的洋红经去紫边后会变成大片死黑
        black = sum(1 for r, g, b, a in solid if max(r, g, b) < 14) / len(solid)
        if black > 0.25:
            problems.append(f'大片死黑 {black:.0%}')
        colors = len({(r // 16, g // 16, b // 16) for r, g, b, a in solid})
        if colors < 6:
            problems.append(f'颜色过少（{colors}），可能是空图或纯色')
    else:
        problems.append('没有不透明内容')
    return problems


def check_site():
    bad = 0
    total = 0

    def report(path, cut, limit=0.005):
        nonlocal bad, total
        total += 1
        issues = inspect(path, cut, limit)
        if issues:
            bad += 1
            print(' 问题', path.relative_to(OUT), '；'.join(issues))

    for folder, count, cut in SITE:
        files = sorted((OUT / folder).glob('*.webp'))
        if len(files) != count:
            bad += 1
            print(f' 数量不对 {folder}：应有 {count}，实有 {len(files)}')
        for f in files:
            report(f, cut, 0.2 if folder.split('/')[0] in ('role', 'jinyi', 'pet') else 0.005)
    for prefix in ('scene', 'scene/m'):
        for name in SCENE_CUT:
            report(OUT / prefix / f'{name}.webp', True)
        for name in SCENE_FULL:
            report(OUT / prefix / f'{name}.webp', False)
    report(OUT / 'scene/gate.webp', False)
    report(OUT / 'scene/title.webp', True)
    report(OUT / 'logo-mark.webp', True)
    report(OUT / 'og_cover.jpg', False)
    # 新图没有覆盖到的旧文件：文件齐全、能解码，但还是上一版的画
    newest_raw = {f.stem: f.stat().st_mtime for f in RAW.glob('*.png')}
    weapons = RAW / 'weapons.png'
    if weapons.exists():
        for f in (OUT / 'weapon').glob('*.webp'):
            if f.stat().st_mtime < weapons.stat().st_mtime:
                bad += 1
                print(' 旧图残留', f.relative_to(OUT))
    for prefix, folder in (('role_', 'role'), ('sect_', 'sect'), ('feat_', 'feat'), ('map_', 'map'), ('jinyi_', 'jinyi'), ('qinghua_', 'pet'), ('yunmo_', 'pet')):
        for stem, stamp in newest_raw.items():
            if not stem.startswith(prefix):
                continue
            name = stem if folder == 'pet' else stem[len(prefix):]
            out = OUT / folder / f'{name}.webp'
            if not out.exists() or out.stat().st_mtime < stamp:
                bad += 1
                print(' 旧图残留', out.relative_to(OUT))
    print(f'站内图片共查 {total} 张，问题 {bad} 处')
    return bad


def main():
    files = sorted(list(RAW.glob('role_*.png')) + list(RAW.glob('qinghua_*.png')) + list(RAW.glob('yunmo_*.png')) + list(RAW.glob('jinyi_*.png')))
    bad = []
    for f in files:
        keyed = RAW / 'keyed' / f.name
        im = Image.open(keyed if keyed.exists() and keyed.stat().st_mtime >= f.stat().st_mtime else f)
        if im.mode != 'RGBA':
            bad.append(f)
            print('未抠图', f.name)
            continue
        runs = edge_runs(im.getchannel('A'))
        if runs:
            bad.append(f)
            print(f.stem, runs)
    print(f'原图共 {len(files)} 张，切边 {len(bad)} 张')
    if '--delete' in sys.argv:
        for f in bad:
            (RAW / 'keyed' / f.name).unlink(missing_ok=True)
            f.unlink()
    if check_site() or bad:
        sys.exit(1)


if __name__ == '__main__':
    main()
