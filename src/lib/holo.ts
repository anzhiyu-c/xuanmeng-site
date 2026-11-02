// 卡片跟随鼠标：给 .holo 元素写入鼠标位置，轻微倾斜和柔光都交给 CSS
import { coarse, reduced } from './motion';

export function initHolo() {
  if (reduced || coarse) return;
  let active: HTMLElement | null = null;

  const clear = () => {
    if (!active) return;
    active.style.setProperty('--rx', '0deg');
    active.style.setProperty('--ry', '0deg');
    active.style.setProperty('--on', '0');
    active = null;
  };

  document.addEventListener('pointermove', (e) => {
    const el = (e.target as Element).closest?.<HTMLElement>('.holo') ?? null;
    if (el !== active) clear();
    if (!el) return;
    active = el;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    el.style.setProperty('--ry', `${(x - 0.5) * 6}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * 5}deg`);
    el.style.setProperty('--on', '1');
  }, { passive: true });
  document.addEventListener('pointerleave', clear);
}
