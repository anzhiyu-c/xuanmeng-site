// 特色长卷：竖向滚动被转换成横向展卷。一轴绢本从右向左缓缓展开（合中国手卷的阅读方向）。
import { FEATURES } from '../data/content';
import { featImg } from '../data/assets';
import { gsap, reduced } from '../lib/motion';

export function initFeatures() {
  const root = document.querySelector<HTMLElement>('#features');
  if (!root) return;

  root.innerHTML = `
    <div class="scroll-pin" id="scroll-pin">
      <div class="scroll-rod rod-right" aria-hidden="true"></div>
      <div class="scroll-rod rod-left" aria-hidden="true"></div>
      <div class="scroll-view" id="scroll-view">
        <div class="scroll-track" id="scroll-track">
          <header class="scroll-intro">
            <h2 class="inscription" id="features-title" data-reveal-title>八大特色</h2>
            <p class="inscription scroll-poem">构筑完整三界江湖的核心系统</p>
          </header>
          ${FEATURES.map((f) => `
            <article class="scroll-panel">
              <figure><img src="${featImg(f.key)}" alt="${f.title}" loading="lazy" decoding="async" /></figure>
              <div class="scroll-text">
                <h3 class="inscription">${f.title}</h3>
                <p>${f.desc}</p>
              </div>
            </article>`).join('')}
          <a class="scroll-end" href="/features/"><span class="inscription">展阅全卷</span></a>
        </div>
      </div>
    </div>
  `;

  if (reduced || innerWidth < 768) {
    root.classList.add('is-stacked');
    return;
  }

  const pin = root.querySelector<HTMLElement>('#scroll-pin')!;
  const track = root.querySelector<HTMLElement>('#scroll-track')!;
  const view = root.querySelector<HTMLElement>('#scroll-view')!;
  const rodRight = root.querySelector<HTMLElement>('.rod-right')!;
  const rodLeft = root.querySelector<HTMLElement>('.rod-left')!;
  const panels = [...root.querySelectorAll<HTMLElement>('.scroll-panel')];

  // 轨道向右移动，读到的内容从右向左展开
  const distance = () => Math.max(0, track.scrollWidth - view.clientWidth);
  gsap.set(track, { x: () => -distance() });

  const center = () => view.clientWidth / 2;
  const slide = gsap.to(track, {
    x: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => `+=${distance() * 0.72}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
    onUpdate() {
      // 卷动时每幅画在框内反向滑动，卷轴表面的高光也随之转动
      const x = Number(gsap.getProperty(track, 'x'));
      panels.forEach((p) => {
        const dist = (p.offsetLeft + p.offsetWidth / 2 + x - center()) / view.clientWidth;
        if (Math.abs(dist) < 1.4) gsap.set(p.querySelector('img'), { xPercent: dist * -6 });
      });
    },
  });
  void slide;

  // 进入：两根卷轴从中央分开，绢面随之露出
  gsap.fromTo(
    view,
    { clipPath: 'inset(0 46% 0 46%)' },
    {
      clipPath: 'inset(0 0% 0 0%)',
      ease: 'power2.inOut',
      scrollTrigger: { trigger: root, start: 'top 85%', end: 'top 12%', scrub: 0.8 },
    },
  );
  gsap.fromTo(rodLeft, { xPercent: 0, x: () => innerWidth * 0.44 }, { x: 0, ease: 'power2.inOut', scrollTrigger: { trigger: root, start: 'top 85%', end: 'top 12%', scrub: 0.8 } });
  gsap.fromTo(rodRight, { x: () => -innerWidth * 0.44 }, { x: 0, ease: 'power2.inOut', scrollTrigger: { trigger: root, start: 'top 85%', end: 'top 12%', scrub: 0.8 } });
}
