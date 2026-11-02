import { featImg, IMG } from '../data/assets';
import { FEATURES } from '../data/content';
import { finishPage, gsap, page, pageHero, reduced, startPage } from './shell';

startPage();

const CATS = [
  ['all', '全部特色'],
  ['battle', '战斗玩法'],
  ['grow', '养成系统'],
  ['look', '外观收藏'],
  ['social', '社交休闲'],
] as const;

page().innerHTML = `
  ${pageHero({ title: '八大特色', sub: '构筑完整三界江湖的核心系统', image: IMG('scene/xian_far.webp') })}
  <div class="filter-bar" role="tablist" aria-label="特色分类">
    ${CATS.map(([k, t], i) => `<button type="button" role="tab" data-cat="${k}" aria-selected="${i === 0}">${t}</button>`).join('')}
  </div>
  <section class="fp-list" id="fp-list">
    ${FEATURES.map((f, i) => `
      <article class="fp" data-cat="${f.cat}">
        <figure data-unroll="${i % 2 ? 'right' : 'left'}"><img src="${featImg(f.key)}" alt="${f.title}" loading="lazy" decoding="async" /></figure>
        <div class="fp-text">
          <span class="fp-label">${f.label}</span>
          <h2>${f.title}</h2>
          <p>${f.desc}</p>
        </div>
      </article>`).join('')}
  </section>
`;

const items = [...document.querySelectorAll<HTMLElement>('.fp')];
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.filter-bar button')];

tabs.forEach((tab) =>
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    const cat = tab.dataset.cat!;
    const show = () => {
      items.forEach((it) => { it.hidden = cat !== 'all' && it.dataset.cat !== cat; });
      if (!reduced) gsap.fromTo('#fp-list', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
    };
    if (reduced) show();
    else gsap.to('#fp-list', { opacity: 0, duration: 0.22, onComplete: show });
  }),
);

finishPage();
