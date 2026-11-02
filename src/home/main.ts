import '../styles/tokens.css';
import '../styles/chrome.css';
import '../styles/home.css';

import { announcements, getInk, initChrome } from '../lib/chrome';
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
  heroNews.innerHTML = `<span class="seal">新</span><a href="${latest.link ? `/${latest.link}` : '/news/'}">${latest.title}</a><time>${latest.date}</time>`;
}

// 各区块自行渲染 DOM，再统一接滚动动效
initRoles();
initSects();
initFeatures();
initDreams();
initGate();
document.querySelectorAll<HTMLElement>('[data-reveal-title]').forEach(revealTitle);

const loader = document.querySelector<HTMLElement>('#loader')!;
const pct = document.querySelector<HTMLElement>('#loader-pct')!;
const ink = getInk();
ink?.fill();

const setPct = (v: number) => {
  pct.textContent = String(Math.round(v * 100));
};

async function boot() {
  const flight = await initFlight(setPct);

  // 字体与首屏贴图就绪后再开幕
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  setPct(1);

  if (reduced || !ink) {
    loader.remove();
    getInk()?.canvas.style.setProperty('display', 'none');
    flight?.showIntroInstant();
    return;
  }

  gsap.to(loader, { opacity: 0, duration: 0.5, delay: 0.15, onComplete: () => loader.remove() });
  // 墨散开的同时标题被一笔扫出，这是全站唯一一次“自动”的大动画
  const open = ink.reveal({ from: [0.5, 0.56], duration: 2.3 });
  flight?.playIntro();
  await open;
}

boot();
