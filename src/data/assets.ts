// 三界场景分层配置，以及各图片的统一路径
import type { ChapterDef, LayerDef, TitleDef } from '../gl/flight';

export const IMG = (name: string) => `/img/${name}`;
/** 三界场景图：手机用 1200 宽的版本 */
export const sceneImg = (name: string) => IMG(`scene/${window.innerWidth < 768 ? 'm/' : ''}${name}.webp`);
/** 立绘：手机用小图 */
export const roleImg = (name: string) => IMG(`role/${name}.webp`);
export const roleThumb = (name: string) => IMG(`role/thumb/${name}.webp`);
export const roleSmall = (name: string) => IMG(`role/small/${name}.webp`);
export const sectSmall = (name: string) => IMG(`sect/small/${name}.webp`);
export const petSmall = (file: string) => IMG(`pet/small/${file}`);
export const sectImg = (name: string) => IMG(`sect/${name}.webp`);
export const petImg = (file: string) => IMG(`pet/${file}`);
export const featImg = (key: string) => IMG(`feat/${key}.webp`);
export const mapImg = (name: string) => IMG(`map/${name}.webp`);

// 飘在镜头前的角色。手机屏小，用小图就够
const cast = (name: string, opts: Omit<LayerDef, 'src' | 'speed' | 'bob'> & { bob?: number }): LayerDef => ({
  src: window.innerWidth < 768 ? roleSmall(name) : roleImg(name),
  speed: 0.24,
  bob: 0.005,
  ...opts,
});

export const CHAPTERS: ChapterDef[] = [
  {
    key: 'xian',
    travel: 30,
    fog: '#dfe9f2',
    dust: '#fff4dc',
    rise: 0.28,
    light: { x: 0, y: 0.5, color: '#fff2d6', power: 0.16 },
    layers: [
      { src: sceneImg('xian_far'), depth: 200, h: 1, cover: true },
      { src: sceneImg('xian_mid'), depth: 66, h: 1.08, y: 0.02, fog: 0.04, hideAtStart: true },
      cast('舞天姬', { depth: 34, h: 0.5, x: 0.05, y: 0.16, enter: { x: 0.2, y: 0.6, delay: 0.5 }, portrait: { x: -0.1, y: 0.03, h: 0.24 } }),
      cast('飞燕女', { depth: 28, h: 0.62, x: 0.2, y: -0.11, enter: { x: -0.2, y: -0.6, delay: 0.3 }, portrait: { x: -0.08, y: -0.2, h: 0.28 } }),
      cast('剑侠客', { depth: 25, h: 0.74, x: 0.52, y: 0.06, enter: { x: 0.6, y: 0.5, delay: 0.12 }, portrait: { x: 0.08, y: -0.09, h: 0.32 } }),
      cast('虎头怪', { depth: 22, h: 0.36, x: 0.72, y: -0.2, enter: { x: 0.5, y: -0.5, delay: 0.72 }, portrait: { x: 0.16, y: -0.25, h: 0.15 } }),
      { src: sceneImg('xian_near'), depth: 18, h: 1.14, y: -0.13 },
    ],
  },
  {
    key: 'ren',
    travel: 30,
    fog: '#f0d9b8',
    dust: '#ffe6bd',
    rise: 0.42,
    light: { x: 0, y: 0.3, color: '#ffcf94', power: 0.1 },
    layers: [
      { src: sceneImg('ren_far'), depth: 200, h: 1, cover: true },
      { src: sceneImg('ren_mid'), depth: 66, h: 1.05, y: -0.02, fog: 0.06 },
      cast('巫蛮儿', { depth: 32, h: 0.62, x: -0.66, y: 0.1, portrait: { x: -0.13, y: 0.24, h: 0.22 } }),
      cast('英女侠', { depth: 26, h: 0.66, x: -0.22, y: -0.08, portrait: { x: 0.13, y: 0.22, h: 0.24 } }),
      cast('逍遥生', { depth: 22, h: 0.74, x: -0.5, y: -0.11, portrait: { x: 0, y: 0.02, h: 0.3 } }),
      { src: sceneImg('ren_near'), depth: 18, h: 1.14, y: 0 },
    ],
  },
  {
    key: 'mo',
    travel: 30,
    fog: '#54385c',
    dust: '#f2b08a',
    rise: 0.7,
    light: { x: 0.56, y: 0.76, color: '#e88a6a', power: 0.1 },
    layers: [
      { src: sceneImg('mo_far'), depth: 200, h: 1, cover: true },
      { src: sceneImg('mo_mid'), depth: 66, h: 1.05, y: -0.01, fog: 0.05 },
      cast('狐美人', { depth: 32, h: 0.64, x: 0.68, y: 0.12, portrait: { x: 0.13, y: 0.25, h: 0.24 } }),
      cast('巨魔王', { depth: 26, h: 0.74, x: 0.46, y: -0.1, portrait: { x: -0.11, y: 0.22, h: 0.26 } }),
      cast('鬼潇潇', { depth: 22, h: 0.62, x: 0.16, y: -0.15, portrait: { x: 0.02, y: 0, h: 0.3 } }),
      { src: sceneImg('mo_near'), depth: 18, h: 1.14, y: -0.01 },
    ],
  },
];

export const TITLE: TitleDef = {
  src: IMG('scene/title.webp'),
  depth: 40,
  h: 0.3,
  x: -0.46,
  y: 0.14,
  portrait: { x: 0, y: 0.32, h: 0.17 },
};
