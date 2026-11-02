import { GAME } from '../data/game-data.js';
import { sectSmall } from '../data/assets';
import { RACE_META } from '../data/race';
import { mountSectGallery } from '../home/sects';
import { scrollToEl } from '../lib/motion';
import { finishPage, gsap, page, reduced, startPage } from './shell';

startPage();

type Sect = (typeof GAME.sects)[number];

const FILTERS: [string, string, (s: Sect) => boolean][] = [
  ['all', '全部门派', () => true],
  ['ren', '人族门派', (s) => s.race === '人'],
  ['xian', '仙族门派', (s) => s.race === '仙'],
  ['mo', '魔族门派', (s) => s.race === '魔'],
  ['wu', '物理系', (s) => /物理/.test(s.tag)],
  ['fa', '法术系', (s) => /法|雷|火/.test(s.tag)],
  ['feng', '封印系', (s) => /封印|控场/.test(s.tag)],
  ['fu', '辅助系', (s) => /治疗|辅助/.test(s.tag)],
];

page().innerHTML = `
  <section class="sects" id="sects" aria-labelledby="sects-title"></section>
  <section class="sect-grid-sec">
    <div class="filter-bar" role="tablist" aria-label="门派筛选">
      ${FILTERS.map(([k, t], i) => `<button type="button" role="tab" data-f="${k}" aria-selected="${i === 0}">${t}</button>`).join('')}
    </div>
    <ul class="sect-grid" id="sect-grid">
      ${GAME.sects.map((s: Sect) => `
        <li data-name="${s.name}">
          <button class="holo" type="button" aria-label="查看${s.name}">
            <img src="${sectSmall(s.name)}" alt="" loading="lazy" decoding="async" />
            <span class="sg-text"><b>${s.name}</b><small>${s.tag}</small></span>
            <span class="badge" style="--accent:var(--${RACE_META[s.race].key})">${s.race}</span>
          </button>
        </li>`).join('')}
    </ul>
  </section>
`;

const gallery = mountSectGallery(document.querySelector<HTMLElement>('#sects')!);
const items = [...document.querySelectorAll<HTMLElement>('#sect-grid li')];
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.sect-grid-sec .filter-bar button')];

tabs.forEach((tab) =>
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    const test = FILTERS.find(([k]) => k === tab.dataset.f)![2];
    const shown: HTMLElement[] = [];
    items.forEach((li) => {
      const on = test(GAME.sects.find((s: Sect) => s.name === li.dataset.name)!);
      li.hidden = !on;
      if (on) shown.push(li);
    });
    if (!reduced) gsap.fromTo(shown, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, stagger: 0.03, duration: 0.6, ease: 'power3.out' });
  }),
);

document.querySelector('#sect-grid')!.addEventListener('click', (e) => {
  const li = (e.target as Element).closest<HTMLElement>('li[data-name]');
  if (!li) return;
  gallery.select(li.dataset.name!);
  scrollToEl('#sects');
});

if (!reduced) {
  gsap.from(items, {
    scrollTrigger: { trigger: '#sect-grid', start: 'top 82%' },
    opacity: 0,
    y: 44,
    stagger: { each: 0.05, from: 'center' },
    duration: 0.9,
    ease: 'power3.out',
  });
}

finishPage();
