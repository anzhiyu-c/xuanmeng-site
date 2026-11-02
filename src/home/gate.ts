// 终章：公告和下载放在一座光门之前。滚到底时光门放大，下载入口落在门内的光里。
import { announcements, applyDownloadConfig } from '../lib/chrome';
import { gsap, reduced } from '../lib/motion';

export function initGate() {
  const root = document.querySelector<HTMLElement>('#gate');
  if (!root) return;

  const news = announcements().slice(0, 3);

  root.innerHTML = `
    <div class="gate-art" aria-hidden="true"><img src="/img/scene/gate.webp" alt="" loading="lazy" /></div>
    <div class="gate-veil" aria-hidden="true"></div>
    <div class="gate-inner">
      <section class="gate-news" aria-labelledby="gate-news-title">
        <h2 id="gate-news-title">最新公告</h2>
        <ul>
          ${news.map((n) => `<li><a href="${n.link ? `/${n.link}` : '/news/'}"><span class="gn-tag" data-tag="${n.tag}">${n.tag}</span><span class="gn-title">${n.title}</span><time datetime="${n.date}">${n.date}</time></a></li>`).join('')}
        </ul>
        <a class="gate-all" href="/news/">进入公告中心</a>
      </section>
      <section class="gate-dl" aria-labelledby="gate-title">
        <h2 id="gate-title" data-reveal-title>三界辽阔，梦从今始</h2>
        <p class="gate-meta">Windows 客户端　版本号 <span data-dl-version></span><br /><span data-dl-size></span>　<span data-dl-updated></span></p>
        <div class="gate-cta">
          <a class="btn btn-gold" data-dl-direct>立即下载客户端</a>
          <a class="btn btn-ghost" href="/download/">进入下载中心</a>
        </div>
      </section>
    </div>
  `;

  applyDownloadConfig(root);

  if (reduced) return;
  gsap.fromTo(root.querySelector('.gate-art img'), { scale: 1.32 }, {
    scale: 1,
    ease: 'none',
    scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
  });
  gsap.from(root.querySelectorAll('.gate-meta, .gate-cta'), {
    scrollTrigger: { trigger: root, start: 'top 45%' },
    opacity: 0,
    y: 26,
    stagger: 0.12,
    duration: 1.4,
    ease: 'expo.out',
  });
  gsap.from(root.querySelectorAll('.gate-news li'), {
    scrollTrigger: { trigger: root, start: 'top 45%' },
    opacity: 0,
    x: -26,
    stagger: 0.07,
    duration: 0.9,
    delay: 0.2,
    ease: 'power3.out',
  });
}
