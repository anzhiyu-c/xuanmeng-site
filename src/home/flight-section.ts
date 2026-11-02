// 首屏与三界穿行：把滚动进度喂给 WebGL，并编排叠在画面上的文字
import { CHAPTERS, TITLE } from '../data/assets';
import { createFlight } from '../gl/flight';
import { coarse, gsap, reduced, ScrollTrigger, splitChars, whileVisible } from '../lib/motion';

const REALM_SPANS = [
  { id: '#realm-xian', from: 0.09, to: 0.29 },
  { id: '#realm-ren', from: 0.37, to: 0.62 },
  { id: '#realm-mo', from: 0.7, to: 0.97 },
];

export async function initFlight(onProgress: (v: number) => void) {
  const section = document.querySelector<HTMLElement>('#flight')!;
  const stage = document.querySelector<HTMLElement>('#flight-stage')!;
  const canvas = document.querySelector<HTMLCanvasElement>('#flight-canvas')!;
  const copy = document.querySelector<HTMLElement>('#hero-copy')!;
  const line = document.querySelector<HTMLElement>('#hero-line')!;
  const sub = document.querySelector<HTMLElement>('#hero-sub')!;
  const cta = document.querySelector<HTMLElement>('#hero-cta')!;
  const news = document.querySelector<HTMLElement>('#hero-news')!;
  const hint = document.querySelector<HTMLElement>('#scroll-hint')!;
  const rail = [...document.querySelectorAll<HTMLElement>('#realm-rail span')];
  const chars = splitChars(line);
  rail[0]?.classList.add('on');

  if (reduced) {
    document.body.classList.add('static-flight');
    onProgress(1);
    return { playIntro() {}, showIntroInstant() {} };
  }

  const flight = createFlight(canvas, CHAPTERS, TITLE);
  if (!flight) {
    document.body.classList.add('static-flight');
    onProgress(1);
    return { playIntro() {}, showIntroInstant() {} };
  }

  await flight.loadChapter(0, (done, total) => onProgress((done / total) * 0.92));
  // 后两界等用户开始往下滚才加载；只看首屏就离开的访客不用多下载
  const loaded = [true, false, false];
  const ensure = (i: number) => {
    if (loaded[i]) return;
    loaded[i] = true;
    void flight.loadChapter(i);
  };

  whileVisible(stage, (t) => flight.render(t));

  if (!coarse) {
    window.addEventListener('pointermove', (e) => {
      flight.setMouse((e.clientX / innerWidth - 0.5) * 2, -(e.clientY / innerHeight - 0.5) * 2);
    }, { passive: true });
  }

  // 主时间线：整段 #flight 的滚动映射到 0..1
  const state = { s: 0 };
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      state.s = self.progress;
      flight.update(state.s);
      if (state.s > 0.015) ensure(1);
      if (state.s > 0.34) ensure(2);
      const active = state.s < 0.335 ? 0 : state.s < 0.665 ? 1 : 2;
      rail.forEach((el, i) => el.classList.toggle('on', i === active));
      section.dataset.realm = CHAPTERS[active].key;
    },
  });

  // 首屏文字随下滚散去
  gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${innerHeight * 0.9}`, scrub: 0.5 },
  })
    .to(copy, { y: -70, opacity: 0, ease: 'power1.in' }, 0)
    .to(news, { opacity: 0, y: 24 }, 0)
    .to(hint, { opacity: 0 }, 0)
    .fromTo('#realm-rail', { opacity: 0 }, { opacity: 1 }, 0.3);

  // 每一界的文字在该界的进度区间内升起又退场
  REALM_SPANS.forEach(({ id, from, to }) => {
    const el = document.querySelector<HTMLElement>(id)!;
    const name = el.querySelector<HTMLElement>('.realm-name')!;
    const nameChars = splitChars(name);
    const items = [el.querySelector('.realm-text'), el.querySelector('.realm-sects')];
    const total = () => section.offsetHeight - innerHeight;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: () => `top+=${total() * from} top`,
        end: () => `top+=${total() * to} top`,
        scrub: 0.4,
        invalidateOnRefresh: true,
      },
    });
    tl.set(el, { visibility: 'visible' })
      .from(el.querySelector('.badge'), { opacity: 0, duration: 0.1 }, 0)
      .from(nameChars, { yPercent: 112, stagger: 0.03, duration: 0.2, ease: 'power3.out' }, 0.01)
      .from(items, { opacity: 0, y: 24, stagger: 0.04, duration: 0.16, ease: 'power2.out' }, 0.12)
      .to(el, { opacity: 0, y: -46, duration: 0.2, ease: 'power1.in' }, 0.8);
  });

  gsap.set([...chars, sub, cta, news, hint], { opacity: 0 });

  const intro = () => {
    flight.revealTitle(1.8);
    flight.playEnter();
    const tl = gsap.timeline({ delay: 0.9 });
    tl.fromTo(chars, { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.06, duration: 1.2, ease: 'expo.out' })
      .fromTo(sub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' }, '-=0.8')
      .fromTo(cta, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' }, '-=0.95')
      .fromTo([news, hint], { opacity: 0 }, { opacity: 1, duration: 1.2 }, '-=0.6');
  };

  return {
    playIntro: intro,
    showIntroInstant() {
      flight.revealTitle(0.01);
      flight.playEnter();
      gsap.set([...chars, sub, cta, news, hint], { opacity: 1 });
    },
  };
}
