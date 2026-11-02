// 梦影：青花与水墨两个系列共用一块舞台，灵兽立在缓慢转动的法阵上。切换系列时底色在淡青和珍珠灰之间渐变。
import { MENGYING } from '../data/mengying-data.js';
import { petImg, petSmall } from '../data/assets';
import { glowAt } from '../lib/fx';
import { magicCircle } from '../lib/magic';
import { coarse, gsap, reduced } from '../lib/motion';

type Pet = { name: string; base: string; img: string; note?: string; epigraph?: string; intro?: string };

export const SERIES: { key: 'qinghua' | 'yunmo'; title: string; hint: string; list: Pet[] }[] = [
  { key: 'qinghua', title: MENGYING.series.qinghua.title, hint: MENGYING.series.qinghua.hint, list: MENGYING.series.qinghua.list },
  { key: 'yunmo', title: MENGYING.series.yunmo.title, hint: MENGYING.series.yunmo.hint, list: MENGYING.series.yunmo.list },
];

export function initDreams() {
  const root = document.querySelector<HTMLElement>('#dreams');
  if (!root) return;

  root.innerHTML = `
    <div class="dreams-bg" aria-hidden="true"></div>
    <div class="dreams-inner">
      <header class="dreams-head">
        <div class="sec-head"><h2 id="dreams-title" data-reveal-title>梦影绘卷</h2></div>
        <p>虚实相系，影梦幻真。仙人所制双鱼梦影符可引召唤兽入梦，为其唤醒一段灵瓷与画卷的旧梦。</p>
        <div class="dreams-tabs" role="tablist" aria-label="梦影系列">
          ${SERIES.map((s, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="${i === 0}">${s.title}</button>`).join('')}
        </div>
      </header>
      <div class="dreams-stage" id="dreams-stage">
        <div class="dreams-orbit">
          ${magicCircle('dreams-magic')}
          <figure class="dreams-main" id="dreams-main"><img id="dreams-img" alt="" loading="lazy" /></figure>
        </div>
        <div class="dreams-info" id="dreams-info" aria-live="polite"></div>
      </div>
      <ul class="dreams-list" id="dreams-list" aria-label="梦影灵兽列表"></ul>
      <a class="btn btn-ghost dreams-more" href="/pet/">查看全部二十二位梦影</a>
    </div>
  `;

  const main = root.querySelector<HTMLElement>('#dreams-main')!;
  const img = root.querySelector<HTMLImageElement>('#dreams-img')!;
  const info = root.querySelector<HTMLElement>('#dreams-info')!;
  const listEl = root.querySelector<HTMLElement>('#dreams-list')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('.dreams-tabs button')];

  let series = 0;
  let cur = 0;

  const drawInfo = (p: Pet) => {
    const text = SERIES[series].key === 'qinghua' ? (p.note ?? '') : (p.intro ?? '');
    info.innerHTML = `
      <h3>${p.name}</h3>
      <p class="di-base">${p.base}</p>
      ${p.epigraph ? `<p class="di-poem">${p.epigraph}</p>` : ''}
      <p class="di-text">${text}</p>`;
  };

  const show = (i: number, first = false) => {
    cur = i;
    const list = SERIES[series].list;
    const p = list[cur];
    [...listEl.children].forEach((li, k) => {
      li.querySelector('button')?.setAttribute('aria-pressed', String(k === cur));
    });
    if (first || reduced) {
      img.src = petImg(p.img);
      img.alt = p.name;
      drawInfo(p);
      return;
    }
    gsap.to(main, {
      opacity: 0,
      y: -14,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        img.src = petImg(p.img);
        img.alt = p.name;
        drawInfo(p);
        gsap.fromTo(info.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.06, duration: 1, ease: 'expo.out' });
        gsap.fromTo(main, { opacity: 0, y: 22, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'expo.out' });
        glowAt(main, 0.35);
      },
    });
  };

  const drawList = () => {
    listEl.innerHTML = SERIES[series].list
      .map((p, i) => `<li><button type="button" data-i="${i}" aria-pressed="${i === cur}" aria-label="${p.name}"><img src="${petSmall(p.img)}" alt="" loading="lazy" decoding="async" /><span>${p.name.split('·')[1] ?? p.name}</span></button></li>`)
      .join('');
    if (!reduced) gsap.from(listEl.children, { opacity: 0, y: 20, duration: 0.6, stagger: 0.03, ease: 'power2.out' });
  };

  const setSeries = (i: number, first = false) => {
    series = i;
    cur = 0;
    root.dataset.series = SERIES[i].key;
    tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
    drawList();
    show(0, first);
  };

  tabs.forEach((t) => t.addEventListener('click', () => setSeries(Number(t.dataset.i))));
  listEl.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-i]');
    if (b) show(Number(b.dataset.i));
  });

  setSeries(0, true);

  if (!reduced && !coarse) {
    // 鼠标移动时灵兽有轻微的立体倾斜
    const qx = gsap.quickTo(main, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    const qy = gsap.quickTo(main, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    root.addEventListener('pointermove', (e) => {
      qx((e.clientX / innerWidth - 0.5) * 8);
      qy(-(e.clientY / innerHeight - 0.5) * 6);
    }, { passive: true });
  }
  if (!reduced) {
    gsap.to(img, { y: -10, duration: 4.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.from(main, { scrollTrigger: { trigger: root, start: 'top 65%' }, opacity: 0, scale: 0.8, duration: 1.4, ease: 'power3.out', clearProps: 'scale,opacity' });
  }
}
