// 全站滚动与动效的公共入口
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarse = matchMedia('(pointer: coarse)').matches;

let lenis: Lenis | null = null;

export function initScroll(): Lenis | null {
  if (reduced || coarse) {
    ScrollTrigger.config({ ignoreMobileResize: true });
    return null;
  }
  lenis = new Lenis({ duration: 1.25, wheelMultiplier: 0.9, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) (window as unknown as { __lenis: Lenis }).__lenis = lenis;
  return lenis;
}

export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();

export function scrollToEl(target: string | HTMLElement, offset = 0) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.6 });
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}

/** 把一段中文拆成单字 span，供入场动画使用；读屏仍读整句。 */
export function splitChars(el: HTMLElement) {
  const text = el.textContent ?? '';
  const list = [...text];
  el.setAttribute('aria-label', text);
  el.innerHTML = '';
  el.style.setProperty('--n', String(list.length));
  const chars = list.map((c, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', String(i));
    s.textContent = c;
    // 展示字号下全角逗号太散，只留一段气口；读屏仍读整句
    if (c === '，') s.classList.add('ch-gap');
    el.appendChild(s);
    return s;
  });
  return chars;
}

/** 滚动进入视口时，单字从遮罩下方依次滑出，只用于主标题级别的文字。 */
export function revealTitle(el: HTMLElement) {
  const chars = splitChars(el);
  el.classList.add('grad');
  if (reduced) return;
  gsap.from(chars, {
    scrollTrigger: { trigger: el, start: 'top 86%' },
    yPercent: 112,
    duration: 1.5,
    ease: 'expo.out',
    stagger: 0.06,
  });
}

/** 图片揭开：容器从下往上裁开，里面的图同时由大缩回。 */
export function revealImage(el: HTMLElement, start = 'top 86%') {
  if (reduced) return;
  const img = el.querySelector('img');
  gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.7, ease: 'expo.inOut', scrollTrigger: { trigger: el, start } });
  if (img) gsap.fromTo(img, { scale: 1.26 }, { scale: 1, duration: 2.4, ease: 'expo.out', scrollTrigger: { trigger: el, start } });
}

/** 当前窗口内才跑的渲染循环 */
export function whileVisible(el: Element, tick: (t: number) => void) {
  let visible = false;
  let raf = 0;
  const loop = (t: number) => {
    if (!visible) return;
    tick(t / 1000);
    raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    const next = e.isIntersecting;
    if (next && !visible) {
      visible = true;
      raf = requestAnimationFrame(loop);
    } else if (!next) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  }, { rootMargin: '10% 0px' }).observe(el);
}

export { gsap, ScrollTrigger };
