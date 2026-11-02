import { IMG } from '../data/assets';
import { announcements, config } from '../lib/chrome';
import { finishPage, gsap, page, pageHero, reduced, startPage } from './shell';

startPage();

const TAGS = ['全部', '公告', '更新', '活动', '维护'];

page().innerHTML = `
  ${pageHero({ title: '新闻公告', sub: '版本更新、活动资讯与维护安排', image: IMG('scene/ren_far.webp') })}
  <section class="news-sec">
    <div class="filter-bar" role="tablist" aria-label="公告分类">
      ${TAGS.map((t) => `<button type="button" role="tab" data-t="${t}" aria-selected="false">${t === '全部' ? '全部公告' : t}</button>`).join('')}
    </div>
    <ul class="news-list" id="news-list"></ul>
    <button class="btn btn-ghost news-more" id="news-more" type="button" hidden>展开更多</button>
  </section>
`;

const listEl = document.querySelector<HTMLElement>('#news-list')!;
const more = document.querySelector<HTMLButtonElement>('#news-more')!;
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.filter-bar button')];
const PAGE = config().newsVisible || 6;

// 支持 /news/?tag=活动 直达分类
const match = /[?&]tag=([^&]+)/.exec(location.search);
let filter = match ? decodeURIComponent(match[1]) : '全部';
let visible = PAGE;

const render = (animate = true) => {
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.t === filter)));
  const rows = announcements().filter((n) => filter === '全部' || n.tag === filter);
  const slice = rows.slice(0, visible);
  listEl.innerHTML = slice.length
    ? slice
        .map((n) => {
          const inner = `<time datetime="${n.date}">${n.date}</time><span class="nl-tag" data-tag="${n.tag}">${n.tag}</span><span class="nl-title">${n.title}</span>`;
          return n.link ? `<li><a href="/${n.link}">${inner}</a></li>` : `<li><div class="nl-static">${inner}</div></li>`;
        })
        .join('')
    : '<li class="nl-empty">这一类暂时没有公告，看看其他分类。</li>';
  more.hidden = rows.length <= visible;
  if (animate && !reduced) gsap.from(listEl.children, { opacity: 0, x: -24, stagger: 0.04, duration: 0.7, ease: 'power3.out' });
};

tabs.forEach((t) =>
  t.addEventListener('click', () => {
    filter = t.dataset.t!;
    visible = PAGE;
    render();
  }),
);
more.addEventListener('click', () => {
  visible = Number.MAX_SAFE_INTEGER;
  render(false);
});

render();
finishPage();
