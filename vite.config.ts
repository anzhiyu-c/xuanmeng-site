import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const pages = ['features', 'world', 'role', 'sect', 'pet', 'equipment', 'news', 'download'];

export default defineConfig({
  server: { port: 5183, watch: { ignored: ['**/art/**'] } },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(pages.map((p) => [p, resolve(__dirname, `${p}/index.html`)])),
        // 每篇公告一个独立页面，新增文章只需在 news/ 下加文件
        ...Object.fromEntries(
          readdirSync(resolve(__dirname, 'news'))
            .filter((f) => f.endsWith('.html') && f !== 'index.html')
            .map((f) => [`news-${f.replace('.html', '')}`, resolve(__dirname, 'news', f)]),
        ),
      },
    },
  },
});
