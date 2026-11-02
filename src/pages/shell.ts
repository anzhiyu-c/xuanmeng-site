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

/** 内页题头：整幅画面缓慢推进，标题逐字升起 */
export function pageHero(opts: { title: string; sub: string; image: string }) {
  return `
    <header class="page-hero">
      <div class="page-hero-art" style="background-image:url(${opts.image})"></div>
      <div class="page-hero-veil"></div>
      <div class="page-hero-copy">
        <h1 data-reveal-title>${opts.title}</h1>
        <p>${opts.sub}</p>
      </div>
    </header>`;
}

/** 页面内容渲染后调用：接上题头视差、标题入场和图片揭开 */
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

  // 图片从一侧被揭开，内部同时缓缓归位
  root.querySelectorAll<HTMLElement>('[data-pop]').forEach((el) => {
    const img = el.querySelector('img');
    const fromLeft = el.dataset.pop === 'left';
    gsap.fromTo(
      el,
      { clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' },
      { clipPath: 'inset(0 0% 0 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 84%' } },
    );
    if (img) gsap.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 84%' } });
  });
  ScrollTrigger.refresh();
}

export { gsap, reduced, ScrollTrigger };
