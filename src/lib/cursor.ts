// 高级交互的小细节：带惯性的跟随光标、吸附鼠标的按钮、顶部滚动进度线
import { coarse, gsap, reduced, ScrollTrigger } from './motion';

const CLICKABLE = 'a, button, [role="button"], summary';

export function initCursor() {
  const bar = document.createElement('div');
  bar.className = 'scroll-bar';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
  });

  if (reduced || coarse) return;

  const ring = document.createElement('div');
  ring.className = 'cursor';
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);
  const qx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' });
  const qy = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });

  let magnet: HTMLElement | null = null;
  const release = () => {
    if (magnet) gsap.to(magnet, { x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, .5)' });
    magnet = null;
  };

  window.addEventListener('pointermove', (e) => {
    ring.classList.add('is-on');
    qx(e.clientX);
    qy(e.clientY);
    const target = e.target as Element;
    ring.classList.toggle('is-hover', !!target.closest?.(CLICKABLE));

    // 按钮被光标轻轻吸住
    const btn = target.closest?.<HTMLElement>('.btn:not(.is-disabled)') ?? null;
    if (btn !== magnet) release();
    if (btn) {
      magnet = btn;
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(btn, { x: dx * 0.18, y: dy * 0.32, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    ring.classList.remove('is-on');
    release();
  });
}
