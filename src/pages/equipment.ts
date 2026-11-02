import { GAME } from '../data/game-data.js';
import { IMG } from '../data/assets';
import { finishPage, gsap, page, pageHero, reduced, startPage } from './shell';

startPage();

type Weapon = { name: string; names: string[] };
type Armor = { name: string; craft: string; top: string };

const EQUIP = GAME.equipment as { weapons: Weapon[]; armors: Armor[]; weaponCraft: string };
const level = (i: number) => (i === 0 ? '初始' : `${i * 10}级`);

page().innerHTML = `
  ${pageHero({ title: '装备资料库', sub: '十八类武器，五部位防具，10 级到 160 级名器谱', image: IMG('scene/mo_far.webp') })}
  <section class="equip">
    <div class="filter-bar" role="tablist" aria-label="装备分类">
      <button type="button" role="tab" data-c="weapon" aria-selected="true">武器</button>
      <button type="button" role="tab" data-c="armor" aria-selected="false">防具</button>
    </div>
    <div class="equip-grid">
      <ul class="equip-cards" id="equip-cards"></ul>
      <article class="equip-detail glass" id="equip-detail" aria-live="polite"></article>
    </div>
    <p class="equip-note">打造体系：武器由「打造技巧」锻造，头盔、衣服由「裁缝技巧」缝制，项链、腰带、鞋子由「炼金术」炼成。自 10 级至 160 级，级级有名器。</p>
  </section>
`;

const cards = document.querySelector<HTMLElement>('#equip-cards')!;
const detail = document.querySelector<HTMLElement>('#equip-detail')!;
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.equip .filter-bar button')];
let cat: 'weapon' | 'armor' = 'weapon';

const animateDetail = () => {
  if (reduced) return;
  gsap.fromTo(detail.querySelector('.ed-art'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' });
  gsap.fromTo(detail.querySelectorAll('.ed-list li'), { opacity: 0, x: 16 }, { opacity: 1, x: 0, stagger: 0.022, duration: 0.5, ease: 'power2.out' });
};

const showWeapon = (w: Weapon) => {
  detail.innerHTML = `
    <div class="ed-head">
      <img class="ed-art" src="${IMG(`weapon/${w.name}.webp`)}" alt="" />
      <div><h2>${w.name}</h2><p>部位：武器<br />打造：${EQUIP.weaponCraft}</p></div>
    </div>
    <h3>${w.name} · 名器谱</h3>
    <ol class="ed-list">
      ${w.names.map((n, i) => `<li class="${i === w.names.length - 1 ? 'top' : ''}"><b>${n}</b><span>${level(i)}</span></li>`).join('')}
    </ol>`;
  animateDetail();
};

const showArmor = (a: Armor) => {
  detail.innerHTML = `
    <div class="ed-head">
      <span class="ed-art ed-art-text">${a.name.slice(0, 1)}</span>
      <div><h2>${a.name}</h2><p>部位：${a.name}<br />打造：${a.craft}</p></div>
    </div>
    <h3>${a.name} · 顶级名器</h3>
    <ol class="ed-list"><li class="top"><b>${a.top}</b><span>160级</span></li></ol>`;
  animateDetail();
};

const render = () => {
  const list = cat === 'weapon' ? EQUIP.weapons : EQUIP.armors;
  cards.dataset.cat = cat;
  cards.innerHTML = list
    .map((it, i) => `<li><button type="button" data-i="${i}" aria-pressed="${i === 0}">
      ${cat === 'weapon' ? `<img src="${IMG(`weapon/${it.name}.webp`)}" alt="" loading="lazy" />` : `<span class="ec-glyph">${it.name.slice(0, 1)}</span>`}
      <span>${it.name}</span></button></li>`)
    .join('');
  if (!reduced) gsap.from(cards.children, { opacity: 0, scale: 0.86, stagger: 0.025, duration: 0.6, ease: 'power3.out' });
  if (cat === 'weapon') showWeapon(EQUIP.weapons[0]);
  else showArmor(EQUIP.armors[0]);
};

cards.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>('button[data-i]');
  if (!b) return;
  cards.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const i = Number(b.dataset.i);
  if (cat === 'weapon') showWeapon(EQUIP.weapons[i]);
  else showArmor(EQUIP.armors[i]);
});

tabs.forEach((t) =>
  t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    cat = t.dataset.c as 'weapon' | 'armor';
    render();
  }),
);

render();
finishPage();
