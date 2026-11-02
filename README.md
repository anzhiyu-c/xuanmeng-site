# 《玄梦》ONLINE 官网

静态站点，构建产物在 `dist/`，可以直接放到现有服务器上。旧站的页面地址和公告地址全部保留。

## 开发与构建

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm build
```

## 日常运营

这些事和旧站一样，改完重新构建即可。构建后也可以直接改 `dist/js/` 下的同名文件，不用重新构建。

| 要做的事 | 改哪里 |
| --- | --- |
| 开关下载、改版本号和包体大小 | `public/js/config.js` |
| 增加公告列表项 | `public/js/announcements.js` |
| 增加公告正文 | 复制 `news/` 下任意一篇，改内容后重新构建 |

## 目录

- `src/home/`：首页各段（三界穿行、角色舞台、特色长卷、门派命盘、梦影、月门）
- `src/pages/`：八个内页和公告正文页
- `src/gl/`：WebGL 效果（场景穿行、金焰溶解、水墨切页）
- `src/data/`：角色、门派、装备、梦影等资料
- `public/fonts/xm-display-fix.woff2`：修正站酷小薇「回、徊、赐」三字轮廓错误的补丁字体
- `art/`：素材生成与处理脚本

## 素材

全站图片由 Codex 生成，提示词都在 `art/manifest.mjs`。

```bash
node art/gen.mjs ROLES --jobs=3
```

```bash
python3 art/process.py
```

第一条只生成缺失的图，删掉 `art/raw/` 下的某张再运行就能重画。第二条把原图压缩成站点用的 webp，输出到 `public/img/`。

生成后运行 `python3 art/audit.py` 检查透明底素材有没有被画布切边，加 `--delete` 会删掉有问题的原图以便重画。
