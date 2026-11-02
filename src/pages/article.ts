// 公告正文页：正文写死在 HTML 里，这里补上一篇 / 下一篇
import { announcements } from '../lib/chrome';
import { finishPage, startPage } from './shell';

startPage();

// Cloudflare 这类托管会自动去掉 .html，比较时两边都不带后缀
const slug = (path: string) => (path.split('/').pop() ?? '').replace(/\.html$/, '');
const here = slug(location.pathname);
const list = announcements().filter((n) => n.link);
const i = list.findIndex((n) => slug(n.link!) === here);
const pager = document.querySelector<HTMLElement>('#article-pager');

if (pager && i >= 0) {
  const newer = list[i - 1];
  const older = list[i + 1];
  pager.innerHTML = `
    ${newer ? `<a href="/${newer.link}"><small>下一篇</small>${newer.title}</a>` : '<span></span>'}
    <a class="ap-all" href="/news/">返回公告列表</a>
    ${older ? `<a href="/${older.link}"><small>上一篇</small>${older.title}</a>` : '<span></span>'}`;
}

finishPage();
