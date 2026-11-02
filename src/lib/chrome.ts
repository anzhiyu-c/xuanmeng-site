// 全站公共外壳：导航、页脚、下载配置注入、水墨切页、隐匿链接
import { createInk, type InkWash } from '../gl/ink';
import { reduced, scrollToEl, startScroll, stopScroll } from './motion';

export interface SiteConfig {
  downloadEnabled?: boolean;
  downloadDisabledText?: string;
  downloadUrl?: string;
  version?: string;
  size?: string;
  updated?: string;
  mirrorUrl?: string;
  newsVisible?: number;
}

export interface Announcement {
  date: string;
  tag: string;
  title: string;
  link?: string;
}

declare global {
  interface Window {
    XM_CONFIG?: SiteConfig;
    XM_ANNOUNCEMENTS?: Announcement[];
  }
}

export const config = (): SiteConfig => window.XM_CONFIG ?? {};

export const announcements = (): Announcement[] =>
  (window.XM_ANNOUNCEMENTS ?? []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const NAV = [
  ['/', '首页'],
  ['/features/', '游戏特色'],
  ['/world/', '世界观'],
  ['/role/', '角色'],
  ['/sect/', '门派'],
  ['/pet/', '召唤兽'],
  ['/equipment/', '装备'],
  ['/news/', '新闻公告'],
] as const;

let setMenu: (open: boolean) => void = () => {};

function renderChrome() {
  const here = location.pathname.replace(/index\.html$/, '');
  const header = document.createElement('header');
  header.className = 'site-nav';
  header.innerHTML = `
    <a class="brand" href="/" aria-label="玄梦 ONLINE 首页">
      <img src="/img/logo-mark.webp" alt="" width="40" height="44" />
      <span class="brand-name">玄梦</span>
    </a>
    <nav class="nav-links" id="nav-links" aria-label="主导航">
      ${NAV.map(([href, label]) => `<a href="${href}"${here === href ? ' aria-current="page"' : ''}><span>${label}</span></a>`).join('')}
      <a class="btn btn-gold nav-menu-dl" href="/download/">下载游戏</a>
    </nav>
    <a class="btn btn-gold nav-cta" href="/download/">下载游戏</a>
    <button class="nav-burger" id="nav-burger" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="nav-links"><i></i><i></i></button>
  `;
  document.body.prepend(header);

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <p class="footer-brand">玄梦 ONLINE</p>
    <p class="footer-health">抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。</p>
    <p class="footer-copy">Copyright © ${new Date().getFullYear()} 玄梦 ONLINE 版权所有</p>
  `;
  document.body.append(footer);

  const burger = header.querySelector<HTMLButtonElement>('#nav-burger')!;
  setMenu = (open: boolean) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    if (open) stopScroll();
    else startScroll();
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false);
      burger.focus();
    }
  });
  // 窗口拉宽后菜单不再需要，避免页面停留在禁止滚动的状态
  window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  const onScroll = () => document.body.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function absUrl(url?: string) {
  if (!url) return '/download/';
  if (/^https?:\/\//i.test(url) || url.charAt(0) === '/') return url;
  return `/${url}`;
}

/** 与旧站约定一致：运营只改 /js/config.js，页面用 data-dl-* 取值 */
export function applyDownloadConfig(root: ParentNode = document) {
  const cfg = config();
  root.querySelectorAll<HTMLAnchorElement>('[data-dl-direct]').forEach((a) => {
    if (cfg.downloadEnabled === false) {
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
      a.setAttribute('tabindex', '-1');
      a.classList.add('is-disabled');
      a.textContent = cfg.downloadDisabledText || '暂未开放';
      return;
    }
    a.setAttribute('href', absUrl(cfg.downloadUrl));
  });
  root.querySelectorAll('[data-dl-version]').forEach((el) => { el.textContent = cfg.version || ''; });
  root.querySelectorAll('[data-dl-size]').forEach((el) => { el.textContent = cfg.size || ''; });
  root.querySelectorAll('[data-dl-updated]').forEach((el) => { el.textContent = cfg.updated || ''; });
  root.querySelectorAll<HTMLAnchorElement>('[data-dl-mirror]').forEach((a) => {
    if (cfg.downloadEnabled !== false && cfg.mirrorUrl) {
      a.hidden = false;
      a.href = cfg.mirrorUrl;
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/* 旧站约定：摘掉 <a> 的 href（状态栏不显示目标），地址存 data-href，点击由脚本跳转 */
function stealthLinks(go: (url: string, newTab: boolean) => void) {
  const stealth = (a: HTMLAnchorElement) => {
    if (!a.hasAttribute('href')) return;
    a.setAttribute('data-href', a.getAttribute('href')!);
    a.removeAttribute('href');
    if (!a.hasAttribute('tabindex')) a.setAttribute('tabindex', '0');
  };
  const all = (root: Node) => {
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    const el = root as Element;
    if (root.nodeType === 1 && el.matches('a[href]')) stealth(el as HTMLAnchorElement);
    (root as ParentNode).querySelectorAll<HTMLAnchorElement>('a[href]').forEach(stealth);
  };
  all(document);
  new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes.forEach(all);
      if (m.type === 'attributes' && (m.target as Element).matches('a[href]')) stealth(m.target as HTMLAnchorElement);
    });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });

  const follow = (a: HTMLAnchorElement, newTab: boolean) => {
    const url = a.getAttribute('data-href');
    if (url) go(url, newTab || a.target === '_blank');
  };
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[data-href]');
    if (!a) return;
    e.preventDefault();
    lastPoint = [e.clientX / innerWidth, 1 - e.clientY / innerHeight];
    follow(a, e.ctrlKey || e.metaKey);
  });
  document.addEventListener('auxclick', (e) => {
    if (e.button !== 1) return;
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[data-href]');
    if (!a) return;
    e.preventDefault();
    follow(a, true);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[data-href]');
    if (!a) return;
    e.preventDefault();
    follow(a, e.ctrlKey || e.metaKey);
  });
}

let lastPoint: [number, number] = [0.5, 0.5];
let ink: InkWash | null = null;

export function getInk() {
  return ink;
}

export function initChrome() {
  renderChrome();
  applyDownloadConfig();

  const canvas = document.createElement('canvas');
  canvas.id = 'ink';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  ink = reduced ? null : createInk(canvas);
  if (!ink) canvas.style.display = 'none';

  const navigate = async (url: string, newTab: boolean) => {
    if (newTab) {
      window.open(url, '_blank', 'noopener');
      return;
    }
    if (url.charAt(0) === '#') {
      scrollToEl(url);
      return;
    }
    setMenu(false);
    if (ink) await ink.cover({ from: lastPoint });
    window.location.href = url;
  };
  stealthLinks(navigate);

  // 从缓存恢复页面时，切页墨层不能留在屏幕上
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && ink) ink.reveal({ duration: 1 });
  });
}

/** 内页入场：墨从中心散开 */
export function pageEnter() {
  if (!ink) return Promise.resolve();
  ink.fill();
  return ink.reveal({ duration: 1.4 });
}
