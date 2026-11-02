// 三界场景分层配置，以及各图片的统一路径
import type { ChapterDef, TitleDef } from '../gl/flight';

export const IMG = (name: string) => `/img/${name}`;
/** 三界场景图：手机用 1200 宽的版本 */
export const sceneImg = (name: string) => IMG(`scene/${window.innerWidth < 768 ? 'm/' : ''}${name}.webp`);
export const roleImg = (name: string) => IMG(`role/${name}.webp`);
export const roleThumb = (name: string) => IMG(`role/thumb/${name}.webp`);
export const roleSmall = (name: string) => IMG(`role/small/${name}.webp`);
export const sectSmall = (name: string) => IMG(`sect/small/${name}.webp`);
export const petSmall = (file: string) => IMG(`pet/small/${file}`);
export const sectImg = (name: string) => IMG(`sect/${name}.webp`);
export const petImg = (file: string) => IMG(`pet/${file}`);
export const featImg = (key: string) => IMG(`feat/${key}.webp`);
export const mapImg = (name: string) => IMG(`map/${name}.webp`);

export const CHAPTERS: ChapterDef[] = [
  {
    key: 'xian',
    travel: 30,
    fog: '#f4dfb0',
    dust: '#f6d993',
    rise: 0.28,
    light: { x: 0.12, y: 0.5, color: '#ffcf7a', power: 0.2 },
    layers: [
      { src: sceneImg('xian_far'), depth: 200, h: 1, cover: true, grade: '#c9cede' },
      { src: sceneImg('xian_mid'), depth: 66, h: 1.08, y: 0.02, fog: 0.05, grade: '#e6e6ea' },
      { src: sceneImg('xian_near'), depth: 26, h: 1.14, y: -0.02, glint: 0.7 },
    ],
  },
  {
    key: 'ren',
    travel: 30,
    fog: '#3a2340',
    dust: '#ffb765',
    rise: 0.42,
    light: { x: 0, y: 0.2, color: '#ff9a4d', power: 0.34 },
    layers: [
      { src: sceneImg('ren_far'), depth: 200, h: 1, cover: true },
      { src: sceneImg('ren_mid'), depth: 66, h: 1.05, y: -0.02, fog: 0.1 },
      { src: sceneImg('ren_near'), depth: 26, h: 1.14, y: 0, glint: 0.7 },
    ],
  },
  {
    key: 'mo',
    travel: 30,
    fog: '#1b0a26',
    dust: '#ff6a2a',
    rise: 1.15,
    light: { x: 0, y: 0.42, color: '#e0431c', power: 0.42 },
    layers: [
      { src: sceneImg('mo_far'), depth: 200, h: 1, cover: true },
      { src: sceneImg('mo_mid'), depth: 66, h: 1.05, y: -0.01, fog: 0.08 },
      { src: sceneImg('mo_near'), depth: 26, h: 1.14, y: -0.01, glint: 0.7 },
    ],
  },
];

export const TITLE: TitleDef = { src: IMG('scene/title.webp'), depth: 40, h: 0.49, y: 0.17 };
