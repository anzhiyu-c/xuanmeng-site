// 八大特色：一幕一幕的全屏画面。竖向滚动驱动，下一幅从底部被揭开，上一幅同时缓缓退后。
import { FEATURES } from '../data/content';
import { featImg } from '../data/assets';
import { gsap, reduced } from '../lib/motion';

export function initFeatures() {
  const root = document.querySelector<HTMLElement>('#features');
  if (!root) return;

  root.innerHTML = `
    <div class="feat-pin" id="feat-pin">
      <h2 class="sr-only" id="features-title">八大特色</h2>
      ${FEATURES.map((f, i) => `
        <article class="feat-panel" style="z-index:${i + 1}">
          <div class="feat-art"><img src="${featImg(f.key)}" alt="${f.title}" ${i > 1 ? 'loading="lazy"' : ''} decoding="async" /></div>
          <div class="feat-copy">
            <p class="feat-label">${f.label}</p>
            <h3 class="mask"><span>${f.title}</span></h3>
            <p class="feat-desc">${f.desc}</p>
          </div>
        </article>`).join('')}
      <ol class="feat-ticks" aria-hidden="true">${FEATURES.map(() => '<li></li>').join('')}</ol>
      <a class="btn btn-ghost feat-all" href="/features/">查看全部特色</a>
    </div>
  `;

  if (reduced || innerWidth < 768) {
    root.classList.add('is-stacked');
    return;
  }

  const pin = root.querySelector<HTMLElement>('#feat-pin')!;
  const panels = [...root.querySelectorAll<HTMLElement>('.feat-panel')];
  const ticks = [...root.querySelectorAll<HTMLElement>('.feat-ticks li')];
  ticks[0]?.classList.add('on');

  // 第一幅随区块进入时自己揭开文字
  const first = panels[0];
  gsap.from(first.querySelector('.feat-copy h3 span'), { yPercent: 112, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: pin, start: 'top 55%' } });
  gsap.from(first.querySelectorAll('.feat-label, .feat-desc'), { opacity: 0, y: 18, duration: 1.4, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: pin, start: 'top 55%' } });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => `+=${innerHeight * (panels.length - 1) * 1.05}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate(self) {
        const cur = Math.round(self.progress * (panels.length - 1));
        ticks.forEach((t, i) => t.classList.toggle('on', i === cur));
      },
    },
  });

  panels.forEach((panel, i) => {
    if (i === 0) return;
    const at = i - 1;
    const prev = panels[i - 1];
    tl.fromTo(panel, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1, ease: 'power2.inOut' }, at)
      .fromTo(panel.querySelector('img'), { scale: 1.3, yPercent: 8 }, { scale: 1.04, yPercent: 0, duration: 1, ease: 'power2.out' }, at)
      .to(prev.querySelector('img'), { yPercent: -10, scale: 1.1, duration: 1, ease: 'power2.inOut' }, at)
      .to(prev.querySelector('.feat-copy'), { y: -60, opacity: 0, duration: 0.5, ease: 'power2.in' }, at)
      .from(panel.querySelector('.feat-copy h3 span'), { yPercent: 112, duration: 0.5, ease: 'power3.out' }, at + 0.5)
      .from(panel.querySelectorAll('.feat-label, .feat-desc'), { opacity: 0, y: 20, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, at + 0.56);
  });
}
