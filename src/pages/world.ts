import { IMG, mapImg } from '../data/assets';
import { ERAS, REGIONS, WORLD_STORY } from '../data/content';
import { coarse } from '../lib/motion';
import { finishPage, gsap, page, pageHero, reduced, startPage } from './shell';

startPage();

page().innerHTML = `
  ${pageHero({ title: '玄梦大陆', sub: '四大部洲，人仙魔三族，一场跨越三界的因缘', image: IMG('scene/ren_far.webp') })}
  <section class="world-map-sec">
    <div class="filter-bar" role="tablist" aria-label="四大部洲">
      ${REGIONS.map((r, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="${i === 0}">${r.name}</button>`).join('')}
    </div>
    <div class="world-map-grid">
      <div class="world-map" id="world-map">
        <div class="world-map-inner" id="world-map-inner">
          ${REGIONS.map((r, i) => `<img data-i="${i}" src="${mapImg(r.name)}" alt="${r.name}地图" ${i ? 'loading="lazy"' : ''} style="opacity:${i ? 0 : 1}" />`).join('')}
          <div class="world-pins" id="world-pins"></div>
        </div>
      </div>
      <div class="world-side" id="world-side" aria-live="polite"></div>
    </div>
  </section>

  <section class="world-story">
    <h2 class="inscription" data-reveal-title>三界背景</h2>
    <div>
      ${WORLD_STORY.map((p) => `<p>${p}</p>`).join('')}
      <dl class="world-facts">
        <div><dt>势力 · 人仙魔</dt><dd>人族聚居长安，仙族司职天庭四海，魔族雄踞酆都群岭。三族十六门派，共守三界。</dd></div>
        <div><dt>奇缘 · 梦影与秘境</dt><dd>仙人所制双鱼梦影符可引召唤兽入梦；归墟秘境四境试炼，等待强者破关。</dd></div>
      </dl>
      <p class="world-close">三界辽阔，梦从今始。</p>
    </div>
  </section>

  <section class="world-eras" aria-label="三界纪元">
    <div class="eras-line" id="eras-line"></div>
    <ol>
      ${ERAS.map((e) => `<li><h3>${e.name}</h3><p>${e.text}</p></li>`).join('')}
    </ol>
  </section>
`;

const pins = document.querySelector<HTMLElement>('#world-pins')!;
const side = document.querySelector<HTMLElement>('#world-side')!;
const imgs = [...document.querySelectorAll<HTMLImageElement>('#world-map-inner img')];
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.world-map-sec button')];
let current = -1;

const show = (i: number) => {
  if (i === current) return;
  const r = REGIONS[i];
  const prev = current;
  current = i;
  tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
  if (reduced || prev < 0) {
    imgs.forEach((im, k) => { im.style.opacity = k === i ? '1' : '0'; });
  } else {
    gsap.to(imgs[prev], { opacity: 0, scale: 1.05, duration: 1, ease: 'power2.inOut' });
    gsap.fromTo(imgs[i], { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.inOut' });
  }
  pins.innerHTML = r.places.map((p) => `<span class="pin" style="left:${p.x}%;top:${p.y}%"><i></i><b>${p.name}</b></span>`).join('');
  side.innerHTML = `<h2>${r.name}</h2><p class="ws-tip">${r.tip}</p><p>${r.desc}</p>`;
  if (!reduced) {
    gsap.from(pins.children, { opacity: 0, y: 12, scale: 0.8, stagger: 0.08, duration: 0.7, delay: 0.3, ease: 'back.out(2)' });
    gsap.fromTo(side.children, { opacity: 0, x: 22 }, { opacity: 1, x: 0, stagger: 0.07, duration: 0.8, ease: 'power3.out' });
  }
};

tabs.forEach((t) => t.addEventListener('click', () => show(Number(t.dataset.i))));
show(0);

if (!reduced && !coarse) {
  const inner = document.querySelector<HTMLElement>('#world-map-inner')!;
  const map = document.querySelector<HTMLElement>('#world-map')!;
  const qx = gsap.quickTo(inner, 'x', { duration: 1, ease: 'power3.out' });
  const qy = gsap.quickTo(inner, 'y', { duration: 1, ease: 'power3.out' });
  map.addEventListener('pointermove', (e) => {
    const b = map.getBoundingClientRect();
    qx(-((e.clientX - b.left) / b.width - 0.5) * 26);
    qy(-((e.clientY - b.top) / b.height - 0.5) * 18);
  });
}

if (!reduced) {
  gsap.fromTo('#eras-line', { scaleX: 0 }, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.world-eras', start: 'top 80%', end: 'top 30%', scrub: 0.6 },
  });
}

finishPage();
