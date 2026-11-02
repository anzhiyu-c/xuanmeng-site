#!/usr/bin/env python3
"""检查透明底素材是否被画布切边：不透明像素贴着图片边缘连成一段，就是被裁掉了。

用法：python3 art/audit.py            只报告
      python3 art/audit.py --delete  同时删掉有问题的原图，下次 gen.mjs 会重画
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'art/raw'
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


def main():
    files = sorted(list(RAW.glob('role_*.png')) + list(RAW.glob('qinghua_*.png')) + list(RAW.glob('yunmo_*.png')) + list(RAW.glob('jinyi_*.png')))
    bad = []
    for f in files:
        keyed = RAW / 'keyed' / f.name
        im = Image.open(keyed if keyed.exists() and keyed.stat().st_mtime >= f.stat().st_mtime else f)
        if im.mode != 'RGBA':
            print('未抠图', f.name)
            continue
        runs = edge_runs(im.getchannel('A'))
        if runs:
            bad.append(f)
            print(f.stem, runs)
    print(f'共 {len(files)} 张，切边 {len(bad)} 张')
    if '--delete' in sys.argv:
        for f in bad:
            (RAW / 'keyed' / f.name).unlink(missing_ok=True)
            f.unlink()


if __name__ == '__main__':
    main()
