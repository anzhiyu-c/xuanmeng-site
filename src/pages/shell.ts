// 内页公共入口
import '../styles/tokens.css';
import '../styles/chrome.css';
import '../styles/home.css';
import '../styles/pages.css';

import { initChrome, pageEnter } from '../lib/chrome';
import { gsap, initScroll, reduced, revealTitle, ScrollTrigger } from '../lib/motion';

export function startPage() {
  initChrome();
  initScroll();
  void pageEnter();
}

export const page = () => document.querySelector<HTMLElement>('#page')!;

/** 内页题头：整幅绘画缓慢推进，标题逐字显影 */
export function pageHero(opts: { title: string; sub: string; image: string; seal?: string }) {
  return `
    <header class="page-hero">
      <div class="page-hero-art" style="background-image:url(${opts.image})"></div>
      <div class="page-hero-veil"></div>
      <div class="page-hero-copy">
        ${opts.seal ? `<span class="seal">${opts.seal}</span>` : ''}
        <h1 data-reveal-title>${opts.title}</h1>
        <p>${opts.sub}</p>
      </div>
    </header>`;
}

/** 页面内容渲染后调用：接上题头视差、标题显影和图片展卷 */
export function finishPage(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-reveal-title]').forEach(revealTitle);
  if (reduced) return;

  const art = root.querySelector('.page-hero-art');
  if (art) {
    gsap.fromTo(art, { scale: 1.14 }, { scale: 1, duration: 3, ease: 'power2.out' });
    gsap.to(art, {
      yPercent: 14,
      ease: 'none',
      scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  // 画作像卷轴一样从一侧展开，内部同时缓缓归位
  root.querySelectorAll<HTMLElement>('[data-unroll]').forEach((el) => {
    const img = el.querySelector('img');
    const fromLeft = el.dataset.unroll === 'left';
    gsap.fromTo(
      el,
      { clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' },
      { clipPath: 'inset(0 0% 0 0%)', duration: 1.5, ease: 'power3.inOut', scrollTrigger: { trigger: el, start: 'top 82%' } },
    );
    if (img) gsap.fromTo(img, { scale: 1.24 }, { scale: 1, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } });
  });
  ScrollTrigger.refresh();
}

export { gsap, reduced, ScrollTrigger };
