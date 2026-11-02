import { MENGYING } from '../data/mengying-data.js';
import { petImg, petSmall } from '../data/assets';
import { finishPage, gsap, page, reduced, startPage } from './shell';
import { startScroll, stopScroll } from '../lib/motion';

startPage();

type Pet = Record<string, string>;
type Series = { key: string; title: string; full: string; hint: string; fields: [string, string][]; list: Pet[] };

const SERIES: Series[] = Object.entries(MENGYING.series).map(([key, v]) => ({ key, ...(v as unknown as Omit<Series, 'key'>) }));
const ALL = SERIES.flatMap((s) => s.list.map((p) => ({ pet: p, series: s })));

page().innerHTML = `
  <section class="pet-page" data-series="all">
    <header class="pet-head">
      <h1 data-reveal-title>梦影绘卷</h1>
      <p>虚实相系，影梦幻真。仙人所制双鱼梦影符可引召唤兽入梦，为其唤醒一段灵瓷与画卷的旧梦。</p>
      <p class="pet-count">青花古韵 · 水墨灵秀，共二十二位梦影灵兽。</p>
      <div class="filter-bar on-light" role="tablist" aria-label="梦影系列">
        <button type="button" role="tab" data-s="all" aria-selected="true">全部梦影</button>
        ${SERIES.map((s) => `<button type="button" role="tab" data-s="${s.key}" aria-selected="false">${s.title}</button>`).join('')}
      </div>
    </header>
    <ul class="pet-grid" id="pet-grid">
      ${ALL.map(({ pet, series }, i) => `
        <li data-s="${series.key}">
          <button type="button" data-i="${i}" aria-label="查看${pet.name}的梦影故事">
            <img src="${petSmall(pet.img)}" alt="" loading="lazy" decoding="async" />
            <b>${pet.name}</b>
            <small>${pet.base}</small>
          </button>
        </li>`).join('')}
    </ul>
  </section>
  <dialog class="pet-dialog" id="pet-dialog" aria-labelledby="pd-name">
    <button class="pd-close" type="button" aria-label="关闭">关闭</button>
    <figure><img id="pd-img" alt="" /></figure>
    <div class="pd-body" id="pd-body" data-lenis-prevent></div>
  </dialog>
`;

const root = document.querySelector<HTMLElement>('.pet-page')!;
const grid = document.querySelector<HTMLElement>('#pet-grid')!;
const items = [...grid.querySelectorAll<HTMLElement>('li')];
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.filter-bar button')];
const dialog = document.querySelector<HTMLDialogElement>('#pet-dialog')!;
const dImg = document.querySelector<HTMLImageElement>('#pd-img')!;
const dBody = document.querySelector<HTMLElement>('#pd-body')!;

tabs.forEach((tab) =>
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    const s = tab.dataset.s!;
    root.dataset.series = s;
    const shown: HTMLElement[] = [];
    items.forEach((li) => {
      const on = s === 'all' || li.dataset.s === s;
      li.hidden = !on;
      if (on) shown.push(li);
    });
    if (!reduced) gsap.fromTo(shown, { opacity: 0, y: 30, rotate: -2 }, { opacity: 1, y: 0, rotate: 0, stagger: 0.03, duration: 0.8, ease: 'power3.out' });
  }),
);

const open = (i: number) => {
  const { pet, series } = ALL[i];
  dialog.dataset.series = series.key;
  dImg.src = petImg(pet.img);
  dImg.alt = pet.name;
  dBody.innerHTML = `
    <p class="pd-series">${series.full}</p>
    <h2 id="pd-name">${pet.name}</h2>
    <p class="pd-base">${pet.base}</p>
    ${series.fields.map(([k, label]) => (pet[k] ? `<section><h3>${label}</h3><p>${pet[k]}</p></section>` : '')).join('')}
    <p class="pd-hint">${series.hint}</p>`;
  dBody.scrollTop = 0;
  dialog.showModal();
  stopScroll();
  if (!reduced) {
    gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo(dImg, { opacity: 0, scale: 0.86, rotate: -3 }, { opacity: 1, scale: 1, rotate: 0, duration: 1, ease: 'power3.out' });
    gsap.fromTo(dBody.children, { opacity: 0, x: 20 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.7, ease: 'power3.out', delay: 0.1 });
  }
};

grid.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>('button[data-i]');
  if (b) open(Number(b.dataset.i));
});

dialog.querySelector('.pd-close')!.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close', startScroll);

if (!reduced) {
  gsap.from(items, {
    scrollTrigger: { trigger: grid, start: 'top 85%' },
    opacity: 0,
    y: 50,
    stagger: 0.035,
    duration: 1,
    ease: 'power3.out',
  });
}

finishPage();
