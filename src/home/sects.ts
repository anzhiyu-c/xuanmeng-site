// 十六门派：长幅画廊。按三族分组，选中的一幅舒展开，其余收成窄条，详情在画廊下方逐行滑出。
import { GAME } from '../data/game-data.js';
import { sectImg } from '../data/assets';
import { gsap, reduced } from '../lib/motion';
import { RACE_META } from '../data/race';

type Sect = (typeof GAME.sects)[number];

const RACES = ['人', '仙', '魔'];

export function initSects() {
  const root = document.querySelector<HTMLElement>('#sects');
  if (root) mountSectGallery(root, { heading: true });
}

export function mountSectGallery(root: HTMLElement, opts: { heading?: boolean } = {}) {
  const sects: Sect[] = GAME.sects;

  root.innerHTML = `
    ${opts.heading ? `<header class="sects-head"><div class="sec-head"><h2 id="sects-title" data-reveal-title>十六门派</h2></div></header>` : `<h1 class="sr-only" id="sects-title">十六门派</h1>`}
    <div class="sects-tabs" role="tablist" aria-label="按种族查看门派">
      ${RACES.map((r, i) => `<button type="button" role="tab" data-race="${r}" aria-selected="${i === 0}">${RACE_META[r].label}</button>`).join('')}
    </div>
    <div class="sect-rail" id="sect-rail">
      ${sects.map((s) => `
        <button class="sect-slice" type="button" data-name="${s.name}" data-race="${s.race}" aria-label="${s.name}" aria-pressed="false">
          <img src="${sectImg(s.name)}" alt="" loading="lazy" decoding="async" />
          <span class="ss-name">${s.name}</span>
        </button>`).join('')}
    </div>
    <article class="sect-card" id="sect-card" aria-live="polite"></article>
  `;

  const slices = [...root.querySelectorAll<HTMLButtonElement>('.sect-slice')];
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('.sects-tabs button')];
  const card = root.querySelector<HTMLElement>('#sect-card')!;
  let current = '';
  let race = '';

  const drawCard = (s: Sect) => {
    card.innerHTML = `
      <div class="sc-main">
        <p class="sc-tag">${s.tag}</p>
        <h3 class="mask"><span>${s.name}</span></h3>
        <p class="sc-desc">${s.desc}</p>
      </div>
      <dl class="sc-meta">
        <div><dt>门派地点</dt><dd>${s.place}</dd></div>
        <div><dt>门派师傅</dt><dd>${s.master}</dd></div>
        <div><dt>收徒条件</dt><dd>${s.cond}</dd></div>
        <div><dt>主技能</dt><dd>${s.skills.join('、')}</dd></div>
        <div><dt>经脉流派</dt><dd>${s.schools.join('、')}</dd></div>
      </dl>`;
    if (reduced) return;
    gsap.from(card.querySelector('h3 span'), { yPercent: 112, duration: 1.2, ease: 'expo.out' });
    gsap.from(card.querySelectorAll('.sc-tag, .sc-desc, .sc-meta div'), { opacity: 0, y: 14, stagger: 0.04, duration: 1, ease: 'expo.out' });
  };

  const select = (name: string) => {
    if (name === current) return;
    current = name;
    const sect = sects.find((s) => s.name === name)!;
    if (sect.race !== race) setRace(sect.race, name);
    slices.forEach((b) => {
      const on = b.dataset.name === name;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    root.dataset.race = RACE_META[sect.race].key;
    drawCard(sect);
  };

  const setRace = (next: string, pick?: string) => {
    race = next;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.race === next)));
    const shown: HTMLElement[] = [];
    slices.forEach((b) => {
      const on = b.dataset.race === next;
      b.hidden = !on;
      if (on) shown.push(b);
    });
    if (!pick) select(shown[0].dataset.name!);
    if (!reduced) gsap.fromTo(shown, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, stagger: 0.07, ease: 'expo.inOut', clearProps: 'clipPath' });
  };

  slices.forEach((b) => {
    b.addEventListener('click', () => select(b.dataset.name!));
    // 鼠标停留片刻才舒展，避免划过时整排抖动
    let timer = 0;
    b.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      timer = window.setTimeout(() => select(b.dataset.name!), 160);
    });
    b.addEventListener('pointerleave', () => clearTimeout(timer));
  });
  tabs.forEach((t) => t.addEventListener('click', () => {
    current = '';
    setRace(t.dataset.race!);
  }));

  setRace(RACES[0]);

  return { select };
}
