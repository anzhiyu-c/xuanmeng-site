// 全屏柔光层：切换内容时亮起一团柔光再慢慢散去。平时没有东西在屏幕上，也不占用渲染。
import { reduced } from './motion';

type Glow = { x: number; y: number; size: number; age: number; life: number; power: number };

const SPRITE = 96;

function makeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE;
  const g = c.getContext('2d')!;
  const m = SPRITE / 2;
  const glow = g.createRadialGradient(m, m, 0, m, m, m);
  glow.addColorStop(0, 'rgba(255, 250, 236, .9)');
  glow.addColorStop(0.35, 'rgba(255, 246, 224, .32)');
  glow.addColorStop(1, 'rgba(255, 244, 216, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, SPRITE, SPRITE);
  return c;
}

let glowImpl: (x: number, y: number, size?: number, power?: number) => void = () => {};

/** 在屏幕坐标处亮起一团柔光，然后慢慢散去 */
export const glow = (x: number, y: number, size = 520, power = 0.7) => glowImpl(x, y, size, power);

/** 在元素中心亮起一团柔光 */
export function glowAt(el: Element, power = 0.7) {
  const r = el.getBoundingClientRect();
  glow(r.left + r.width / 2, r.top + r.height / 2, Math.max(r.width, r.height) * 1.3, power);
}

export function initFx() {
  if (reduced) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'fx';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d')!;
  const sprite = makeSprite();

  let w = 0;
  let h = 0;
  const resize = () => {
    const d = Math.min(window.devicePixelRatio || 1, 1.5);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * d;
    canvas.height = h * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const glows: Glow[] = [];
  let running = false;
  let last = 0;

  const frame = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = glows.length - 1; i >= 0; i--) {
      const g = glows[i];
      g.age += dt;
      if (g.age >= g.life) {
        glows.splice(i, 1);
        continue;
      }
      const k = g.age / g.life;
      const s = g.size * (0.75 + k * 0.5);
      ctx.globalAlpha = g.power * Math.pow(1 - k, 2);
      ctx.drawImage(sprite, g.x - s, g.y - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
    if (glows.length) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, w, h);
      running = false;
    }
  };

  glowImpl = (x, y, size = 520, power = 0.7) => {
    glows.push({ x, y, size, power, age: 0, life: 1.4 });
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  };
}
