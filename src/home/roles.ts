// 角色舞台：中央立绘光晕溶解切换，身后法阵缓慢转动，两侧立绘在 3D 走马灯上转入，角色全名压在身后。
import { GAME } from '../data/game-data.js';
import { roleImg, roleSmall, roleThumb, sceneImg } from '../data/assets';
import { RACE_META } from '../data/race';
import { createDissolve } from '../gl/dissolve';
import { glow } from '../lib/fx';
import { magicCircle } from '../lib/magic';
import { coarse, gsap, reduced, whileVisible } from '../lib/motion';

type Role = (typeof GAME.roles)[number];

// 舞台排序：仙、人、魔，与上一段下坠的顺序一致
const ORDER = ['仙', '人', '魔'];

export function initRoles() {
  const root = document.querySelector<HTMLElement>('#roles');
  if (!root) return;
  const roles: Role[] = ORDER.flatMap((r) => GAME.roles.filter((x: Role) => x.race === r));
  mountRoleStage(root, roles, { heading: true, start: roles.findIndex((r) => r.name === '飞燕女') });
}

export function mountRoleStage(root: HTMLElement, roles: Role[], opts: { heading?: boolean; start?: number } = {}) {
  root.innerHTML = `
    <div class="roles-bg" aria-hidden="true">
      ${ORDER.map((r) => `<div class="roles-bg-layer" data-race="${RACE_META[r].key}"></div>`).join('')}
      <div class="roles-bg-veil"></div>
    </div>
    ${magicCircle('roles-magic')}
    <span class="roles-glyph" id="roles-glyph" aria-hidden="true"></span>
    ${opts.heading ? `<header class="roles-head">
      <div class="sec-head"><h2 id="roles-title" data-reveal-title>十八角色</h2></div>
    </header>` : `<h1 class="sr-only" id="roles-title">角色资料</h1>`}
    <div class="roles-tabs" role="tablist" aria-label="按种族筛选">
      <button type="button" role="tab" data-filter="全部" aria-selected="true">全部</button>
      ${ORDER.map((r) => `<button type="button" role="tab" data-filter="${r}" aria-selected="false">${RACE_META[r].label}</button>`).join('')}
    </div>
    <div class="roles-stage" id="roles-stage">
      <div class="roles-carousel" id="roles-carousel" aria-hidden="true"></div>
      <div class="roles-hero"><canvas id="roles-canvas" aria-hidden="true"></canvas><img class="roles-fallback" id="roles-fallback" alt="" hidden /></div>
      <div class="roles-flash" id="roles-flash" aria-hidden="true"></div>
      <button class="roles-arrow prev" type="button" aria-label="上一位角色"></button>
      <button class="roles-arrow next" type="button" aria-label="下一位角色"></button>
    </div>
    <div class="roles-info" id="roles-info" aria-live="polite"></div>
    <div class="roles-strip" id="roles-strip" role="listbox" aria-label="选择角色"></div>
  `;

  const stage = root.querySelector<HTMLElement>('#roles-stage')!;
  const carousel = root.querySelector<HTMLElement>('#roles-carousel')!;
  const info = root.querySelector<HTMLElement>('#roles-info')!;
  const strip = root.querySelector<HTMLElement>('#roles-strip')!;
  const glyph = root.querySelector<HTMLElement>('#roles-glyph')!;
  const canvas = root.querySelector<HTMLCanvasElement>('#roles-canvas')!;
  const fallback = root.querySelector<HTMLImageElement>('#roles-fallback')!;
  const flash = root.querySelector<HTMLElement>('#roles-flash')!;
  const magic = root.querySelector<HTMLElement>('.roles-magic')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('.roles-tabs button')];

  let list = roles.slice();
  let cur = Math.max(0, opts.start ?? 0);

  const sources = roles.map((r) => roleImg(r.name));
  const dissolve = reduced ? null : createDissolve(canvas, sources);
  if (!dissolve) {
    canvas.hidden = true;
    fallback.hidden = false;
  }

  carousel.innerHTML = roles.map((r, i) => `<img class="roles-card" data-i="${i}" src="${roleSmall(r.name)}" alt="" loading="lazy" decoding="async" />`).join('');
  const cards = [...carousel.querySelectorAll<HTMLImageElement>('.roles-card')];

  const drawStrip = () => {
    strip.innerHTML = list
      .map((r, i) => `<button type="button" role="option" class="${i === cur ? 'on' : ''}" aria-selected="${i === cur}" data-i="${i}" aria-label="${r.name}" style="--race:var(--${RACE_META[r.race].key})"><img src="${roleThumb(r.name)}" alt="" loading="lazy" /><span>${r.name}</span></button>`)
      .join('');
    const active = strip.querySelector<HTMLElement>('.on');
    if (active) strip.scrollTo({ left: active.offsetLeft - strip.clientWidth / 2 + active.offsetWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  };

  const placeCards = (instant = false) => {
    const n = list.length;
    cards.forEach((el) => {
      const role = roles[Number(el.dataset.i)];
      const i = list.indexOf(role);
      if (i < 0) {
        gsap.to(el, { autoAlpha: 0, duration: 0.3 });
        return;
      }
      let d = i - cur;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      const ad = Math.abs(d);
      const visible = ad > 0 && ad <= 4;
      const side = Math.sign(d);
      const spread = Math.min(innerWidth * 0.17, 250);
      gsap.to(el, {
        duration: instant || reduced ? 0 : 1,
        ease: 'power3.out',
        autoAlpha: visible ? 0.8 - ad * 0.16 : 0,
        x: side * (spread * 0.72 + ad * spread * 0.82),
        z: -ad * 170,
        rotationY: -side * (34 + ad * 3),
        scale: 0.82,
        filter: `saturate(${0.92 - ad * 0.12}) blur(${ad * 0.5}px)`,
        zIndex: 20 - ad,
      });
    });
  };

  const drawInfo = (role: Role, index: number) => {
    const meta = RACE_META[role.race];
    root.dataset.race = meta.key;
    glyph.innerHTML = [...role.name].map((c) => `<span class="ch">${c}</span>`).join('');
    info.innerHTML = `
      <div class="ri-name">
        <span class="badge">${role.race}</span>
        <h3>${role.name}</h3>
        <span class="ri-no">${index + 1}<small> / ${list.length}</small></span>
      </div>
      <p class="ri-intro">${role.intro}</p>
      <dl class="ri-meta">
        <div><dt>可拜门派</dt><dd>${role.sects.join('、')}</dd></div>
        <div><dt>专属武器</dt><dd>${role.weapons.join('、')}</dd></div>
      </dl>`;
    if (!reduced) {
      gsap.fromTo(info.children, { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.07, duration: 1, ease: 'expo.out', delay: 0.16 });
      gsap.from(glyph.children, { yPercent: 104, duration: 1.5, stagger: 0.07, ease: 'expo.out' });
    }
    root.querySelectorAll<HTMLElement>('.roles-bg-layer').forEach((l) => {
      gsap.to(l, { opacity: l.dataset.race === meta.key ? 1 : 0, duration: reduced ? 0 : 1.1, ease: 'power2.inOut' });
    });
    dissolve?.setBurn(meta.burn);
  };

  const go = (i: number, instant = false) => {
    if (!list.length) return;
    cur = (i + list.length) % list.length;
    const role = list[cur];
    const srcIndex = roles.indexOf(role);
    if (!instant && !reduced) {
      // 换人时一层柔光漫过舞台，法阵顺势转过一段
      gsap.fromTo(flash, { opacity: 0.4 }, { opacity: 0, duration: 1.4, ease: 'power2.out' });
      gsap.fromTo(magic, { rotation: -24 }, { rotation: 0, duration: 1.8, ease: 'expo.out' });
      const r = stage.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) glow(r.left + r.width / 2, r.top + r.height * 0.45, r.height * 0.8, 0.45);
    }
    if (dissolve) {
      void dissolve.show(srcIndex, instant);
      // 预加载左右两张，切换不等待
      dissolve.preload(roles.indexOf(list[(cur + 1) % list.length]));
      dissolve.preload(roles.indexOf(list[(cur - 1 + list.length) % list.length]));
    } else {
      fallback.src = roleImg(role.name);
      fallback.alt = role.name;
    }
    drawInfo(role, cur);
    placeCards(instant);
    drawStrip();
  };

  root.querySelector('.roles-arrow.prev')!.addEventListener('click', () => go(cur - 1));
  root.querySelector('.roles-arrow.next')!.addEventListener('click', () => go(cur + 1));
  strip.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-i]');
    if (b) go(Number(b.dataset.i));
  });
  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      const f = tab.dataset.filter!;
      const role = list[cur];
      list = f === '全部' ? roles.slice() : roles.filter((r) => r.race === f);
      cur = Math.max(0, list.indexOf(role));
      go(cur);
    }),
  );

  // 键盘：焦点在舞台区块内时左右键切换
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(cur - 1);
    if (e.key === 'ArrowRight') go(cur + 1);
  });

  // 拖拽 / 轻扫
  let downX: number | null = null;
  stage.addEventListener('pointerdown', (e) => { downX = e.clientX; });
  window.addEventListener('pointerup', (e) => {
    if (downX === null) return;
    const dx = e.clientX - downX;
    downX = null;
    if (Math.abs(dx) > 46) go(cur + (dx < 0 ? 1 : -1));
  });

  if (!coarse && dissolve) {
    root.addEventListener('pointermove', (e) => {
      dissolve.setMouse((e.clientX / innerWidth - 0.5) * 2, -(e.clientY / innerHeight - 0.5) * 2);
    }, { passive: true });
  }

  if (dissolve) whileVisible(root, (t) => dissolve.tick(t));

  // 背景图等区块快到视口时才下载
  const layers = [...root.querySelectorAll<HTMLElement>('.roles-bg-layer')];
  const nearby = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    nearby.disconnect();
    layers.forEach((l) => { l.style.backgroundImage = `url(${sceneImg(`${l.dataset.race}_far`)})`; });
  }, { rootMargin: '100% 0px' });
  nearby.observe(root);

  // 进入视口才开始显形第一位角色，这样用户能看到溶解
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    go(cur);
  };
  new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { threshold: 0.3 }).observe(root);
  // 未入屏时先把文字和列表画好，避免布局跳动
  if (!dissolve) {
    fallback.src = roleImg(list[cur].name);
    fallback.alt = list[cur].name;
  }
  drawInfo(list[cur], cur);
  placeCards(true);
  drawStrip();

  // 滚动进入时，走马灯从两侧展开
  if (!reduced) {
    gsap.from(carousel, {
      scrollTrigger: { trigger: root, start: 'top 70%' },
      opacity: 0,
      scale: 0.92,
      duration: 2,
      ease: 'expo.out',
    });
  }

  window.addEventListener('resize', () => placeCards(true));
}
