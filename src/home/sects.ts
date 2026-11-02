// 门派命盘：三层同心金环，内环人族、中环仙族、外环魔族，共十六格。
// 拖动或滚动转盘，选中的门派转到正上方的指针处。
import { GAME } from '../data/game-data.js';
import { sectImg } from '../data/assets';
import { gsap, reduced, ScrollTrigger } from '../lib/motion';
import { RACE_META } from '../data/race';

type Sect = (typeof GAME.sects)[number];

const RINGS = [
  { race: '人', r: 186, w: 52 },
  { race: '仙', r: 244, w: 52 },
  { race: '魔', r: 302, w: 52 },
];
const SIZE = 680;
const C = SIZE / 2;

const polar = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

function arc(r: number, w: number, a0: number, a1: number) {
  const ri = r - w / 2;
  const ro = r + w / 2;
  const [x0, y0] = polar(ro, a0);
  const [x1, y1] = polar(ro, a1);
  const [x2, y2] = polar(ri, a1);
  const [x3, y3] = polar(ri, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${ro} ${ro} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${ri} ${ri} 0 ${large} 0 ${x3} ${y3}Z`;
}

function ticks(r: number, n: number, len: number) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const deg = (i / n) * 360;
    const [x0, y0] = polar(r, deg);
    const [x1, y1] = polar(r + (i % 5 === 0 ? len * 1.9 : len), deg);
    d += `M${x0} ${y0}L${x1} ${y1}`;
  }
  return d;
}

/** 文字沿格子中心摆放，并始终朝外读 */
function label(r: number, deg: number, text: string) {
  const [x, y] = polar(r, deg);
  return `<text x="${x}" y="${y}" transform="rotate(${deg} ${x} ${y})" text-anchor="middle" dominant-baseline="central">${text}</text>`;
}

export function initSects() {
  const root = document.querySelector<HTMLElement>('#sects');
  if (root) mountSectDial(root, { heading: true });
}

export function mountSectDial(root: HTMLElement, opts: { heading?: boolean } = {}) {
  const sects: Sect[] = GAME.sects;
  const byRace = RINGS.map((ring) => ({ ...ring, list: sects.filter((s) => s.race === ring.race) }));

  const segments = byRace
    .map((ring, ri) => {
      const step = 360 / ring.list.length;
      return ring.list
        .map((s, i) => {
          const a0 = i * step + 1.1;
          const a1 = (i + 1) * step - 1.1;
          const mid = i * step + step / 2;
          return `<g class="seg" data-name="${s.name}" data-ring="${ri}" data-angle="${mid}" tabindex="0" role="button" aria-label="${s.name}">
            <path d="${arc(ring.r, ring.w, a0, a1)}"></path>
            ${label(ring.r, mid, s.name)}
          </g>`;
        })
        .join('');
    });

  root.innerHTML = `
    <div class="sects-sky" aria-hidden="true"></div>
    ${opts.heading ? `<header class="sects-head"><h2 class="inscription" id="sects-title" data-reveal-title>十六门派</h2></header>` : `<h1 class="sr-only" id="sects-title">十六门派</h1>`}
    <div class="sects-body">
      <div class="dial-wrap" id="dial-wrap">
        <div class="dial-art" id="dial-art"><img id="dial-img" alt="" loading="lazy" /></div>
        <svg class="dial" id="dial" viewBox="0 0 ${SIZE} ${SIZE}" aria-label="门派命盘">
          <defs>
            <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f6e3a8" /><stop offset=".5" stop-color="#b98a3f" /><stop offset="1" stop-color="#f6e3a8" />
            </linearGradient>
          </defs>
          <g class="dial-deco" id="dial-deco">
            <circle cx="${C}" cy="${C}" r="150" />
            <circle cx="${C}" cy="${C}" r="334" />
            <path d="${ticks(334, 120, 6)}" />
            <path d="${ticks(143, 72, 5)}" />
          </g>
          ${byRace.map((ring, ri) => `<g class="ring ring-${RACE_META[ring.race].key}" id="ring-${ri}" data-race="${ring.race}">${segments[ri]}</g>`).join('')}
          <path class="dial-pointer" d="M${C} ${C - 340} l-9 -16 h18 z" />
        </svg>
      </div>
      <div>
        <article class="sect-card" id="sect-card" aria-live="polite"></article>
        <p class="dial-legend">命盘由内向外：人族五派、仙族六派、魔族五派</p>
      </div>
    </div>
  `;

  const dialRings = byRace.map((_, ri) => root.querySelector<SVGGElement>(`#ring-${ri}`)!);
  const deco = root.querySelector<SVGGElement>('#dial-deco')!;
  const card = root.querySelector<HTMLElement>('#sect-card')!;
  const img = root.querySelector<HTMLImageElement>('#dial-img')!;
  const art = root.querySelector<HTMLElement>('#dial-art')!;
  const segs = [...root.querySelectorAll<SVGGElement>('.seg')];
  // 每环当前转角，选中时转动对应环，其余两环轻微反向，像真的机括
  const angles = [0, 0, 0];
  let current = '';

  const drawCard = (s: Sect) => {
    card.innerHTML = `
      <div class="sc-head">
        <span class="seal">${s.race}</span>
        <h3>${s.name}</h3>
        <span class="sc-tag">${s.tag}</span>
      </div>
      <p class="sc-desc">${s.desc}</p>
      <dl class="sc-meta">
        <div><dt>门派地点</dt><dd>${s.place}</dd></div>
        <div><dt>门派师傅</dt><dd>${s.master}</dd></div>
        <div><dt>收徒条件</dt><dd>${s.cond}</dd></div>
      </dl>
      <div class="sc-list"><h4>主技能</h4><p>${s.skills.join('、')}</p></div>
      <div class="sc-list"><h4>经脉流派</h4><p>${s.schools.join('、')}</p></div>`;
    if (!reduced) gsap.fromTo(card.children, { opacity: 0, x: 18 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.7, ease: 'power3.out' });
  };

  const select = (name: string, instant = false) => {
    if (name === current) return;
    current = name;
    const el = segs.find((g) => g.dataset.name === name)!;
    const ring = Number(el.dataset.ring);
    const mid = Number(el.dataset.angle);
    segs.forEach((g) => {
      const on = g === el;
      g.classList.toggle('on', on);
      g.setAttribute('aria-pressed', String(on));
    });

    // 走最短弧把选中格转到指针
    const goal = -mid;
    const delta = ((goal - angles[ring] + 540) % 360) - 180;
    angles[ring] += delta;
    const duration = instant || reduced ? 0 : 1.5;
    gsap.to(dialRings[ring], { rotation: angles[ring], svgOrigin: `${C} ${C}`, duration, ease: 'power3.inOut' });
    dialRings.forEach((g, i) => {
      if (i === ring) return;
      angles[i] -= delta * 0.12;
      gsap.to(g, { rotation: angles[i], svgOrigin: `${C} ${C}`, duration, ease: 'power3.inOut' });
    });

    const sect = sects.find((s) => s.name === name)!;
    root.dataset.race = RACE_META[sect.race].key;
    drawCard(sect);
    if (instant || reduced) {
      img.src = sectImg(name);
      img.alt = `${name}景致`;
    } else {
      gsap.to(art, {
        opacity: 0,
        scale: 0.96,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          img.src = sectImg(name);
          img.alt = `${name}景致`;
          gsap.to(art, { opacity: 1, scale: 1, duration: 1, ease: 'power3.out', delay: 0.08 });
        },
      });
    }
  };

  segs.forEach((g) => {
    g.addEventListener('click', () => select(g.dataset.name!));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select(g.dataset.name!);
      }
    });
  });

  select(sects[0].name, true);

  if (!reduced) {
    // 外圈刻度随滚动转动，命盘入场时各环错开展开
    gsap.to(deco, {
      rotation: 120,
      svgOrigin: `${C} ${C}`,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
    gsap.from(dialRings, {
      scrollTrigger: { trigger: root, start: 'top 72%' },
      opacity: 0,
      scale: 0.72,
      rotation: (i: number) => (i % 2 ? 50 : -50),
      svgOrigin: `${C} ${C}`,
      duration: 1.7,
      stagger: 0.14,
      ease: 'power3.out',
      clearProps: 'opacity',
      onComplete: () => {
        dialRings.forEach((g, i) => gsap.set(g, { rotation: angles[i], svgOrigin: `${C} ${C}`, scale: 1 }));
      },
    });
    ScrollTrigger.create({
      trigger: root,
      start: 'top 60%',
      once: true,
      onEnter: () => gsap.from(card, { opacity: 0, x: 40, duration: 1.1, ease: 'power3.out' }),
    });
  }

  return { select };
}
