import '../styles/tokens.css';
import '../styles/chrome.css';
import '../styles/home.css';

import { announcements, getWipe, initChrome } from '../lib/chrome';
import { gsap, initScroll, reduced, revealTitle } from '../lib/motion';
import { initFlight } from './flight-section';
import { initRoles } from './roles';
import { initSects } from './sects';
import { initFeatures } from './features';
import { initDreams } from './dreams';
import { initGate } from './gate';

initChrome();
initScroll();

const heroNews = document.querySelector<HTMLElement>('#hero-news')!;
const latest = announcements()[0];
if (latest) {
  heroNews.innerHTML = `<span class="hn-tag">最新公告</span><a href="${latest.link ? `/${latest.link}` : '/news/'}">${latest.title}</a><time>${latest.date}</time>`;
}

// 各区块自行渲染 DOM，再统一接滚动动效
initRoles();
initSects();
initFeatures();
initDreams();
initGate();
document.querySelectorAll<HTMLElement>('[data-reveal-title]').forEach(revealTitle);

// 区块交界处的云带，随滚动缓缓上浮，把上下两块衔接起来
document.querySelectorAll<HTMLElement>('#flight, #dreams').forEach((section) => {
  const cloud = document.createElement('div');
  cloud.className = 'cloud-edge';
  cloud.setAttribute('aria-hidden', 'true');
  section.append(cloud);
  if (reduced) return;
  gsap.fromTo(cloud, { y: 90 }, {
    y: 0,
    ease: 'none',
    scrollTrigger: { trigger: cloud, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
  });
});

const loader = document.querySelector<HTMLElement>('#loader')!;
const pct = document.querySelector<HTMLElement>('#loader-pct')!;
const wipe = getWipe();
wipe?.fill();

const setPct = (v: number) => {
  pct.textContent = String(Math.round(v * 100));
};

async function boot() {
  const flight = await initFlight(setPct);

  // 字体与首屏贴图就绪后再开幕
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  setPct(1);

  if (reduced || !wipe) {
    loader.remove();
    getWipe()?.canvas.style.setProperty('display', 'none');
    flight?.showIntroInstant();
    return;
  }

  gsap.to(loader, { opacity: 0, duration: 0.6, delay: 0.1, ease: 'power2.out', onComplete: () => loader.remove() });
  // 光幕打开的同时标题显现、角色滑入，这是全站最大的一次自动动画
  const open = wipe.reveal({ from: [0.5, 0.5], duration: 2 });
  flight?.playIntro();
  await open;
}

boot();
