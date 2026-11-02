// 下载页正文写在 HTML 里，版本信息由 data-dl-* 注入，这里只负责动效
import { finishPage, gsap, reduced, startPage } from './shell';

startPage();

if (!reduced) {
  gsap.from('.dl-card', {
    scrollTrigger: { trigger: '.dl-card', start: 'top 85%' },
    opacity: 0,
    y: 40,
    duration: 1.1,
    ease: 'power3.out',
  });
  document.querySelectorAll<HTMLElement>('.dl-panel').forEach((el) => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 86%' }, opacity: 0, y: 34, duration: 1, ease: 'power3.out' });
  });
}

finishPage();
