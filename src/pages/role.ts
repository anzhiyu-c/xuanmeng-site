import { GAME } from '../data/game-data.js';
import { MENGYING } from '../data/mengying-data.js';
import { IMG } from '../data/assets';
import { mountRoleStage } from '../home/roles';
import { finishPage, gsap, page, reduced, startPage } from './shell';

startPage();

const ORDER = ['仙', '人', '魔'];
type Outfit = { name: string; role: string; poem: string; box: string };
const OUTFITS: Outfit[] = MENGYING.jinyi;

page().innerHTML = `
  <section class="roles" id="roles" aria-labelledby="roles-title"></section>
  <section class="jinyi" aria-labelledby="jinyi-title">
    <header>
      <h2 id="jinyi-title" data-reveal-title>锦衣华裳</h2>
      <p>入游戏可自由试穿、千色染色。</p>
    </header>
    <ul class="jinyi-list">
      ${OUTFITS.map((o) => `
        <li>
          <figure><img src="${IMG(`jinyi/${o.name}.webp`)}" alt="${o.name}" loading="lazy" decoding="async" /></figure>
          <h3>${o.name}</h3>
          <p class="ji-role">${o.role} · ${o.box}</p>
          <p class="ji-poem">${o.poem}</p>
        </li>`).join('')}
    </ul>
  </section>
`;

const roles = ORDER.flatMap((r) => GAME.roles.filter((x: { race: string }) => x.race === r));
mountRoleStage(document.querySelector<HTMLElement>('#roles')!, roles, { heading: false });

if (!reduced) {
  // 六件锦衣随滚动横向错开，鼠标悬停时立绘向前浮出
  gsap.from('.jinyi-list li', {
    scrollTrigger: { trigger: '.jinyi-list', start: 'top 80%' },
    opacity: 0,
    y: 70,
    stagger: 0.09,
    duration: 1.1,
    ease: 'power3.out',
  });
}

finishPage();
