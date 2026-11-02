/* ============================================================
   玄梦官网公告数据 —— 运营直接编辑本文件
   字段说明：
     date  "2026-07-19" 展示与排序用
     tag   "公告" | "更新" | "活动" | "维护"（对应页面页签）
     title 标题（列表单行显示，过长自动省略）
     link  新公告必填。指向 website/news/YYYY-MM-DD-<slug>.html。
           没有 link 时首页会掉进公告中心、侧栏点不动、右侧仍是旧文。
           旧条目可暂时缺 link，新加的一律必须有独立文章页。
   新公告往数组最前面加即可（页面也会按日期倒序兜底排序）。
   发公告时必须同时：① 本文件加一条（date/tag/title/link）
                     ② 按 news/2026-07-19-official-launch.html 的壳新建正文页。
   每次发版只加一篇 tag="更新"（标题如「2026年9月14日更新」），不要再配同日「维护」篇。
   先把草稿给用户确认，再改本文件并上站；禁止未确认就部署 www.xuanmeng.cc。
   ============================================================ */
window.XM_ANNOUNCEMENTS = [
  {
    date: "2026-11-01",
    tag: "更新",
    title: "2026年11月1日更新",
    link: "news/2026-11-01-update.html"
  },
  {
    date: "2026-10-31",
    tag: "更新",
    title: "2026年10月31日更新",
    link: "news/2026-10-31-update.html"
  },
  {
    date: "2026-10-30",
    tag: "更新",
    title: "2026年10月30日更新",
    link: "news/2026-10-30-update.html"
  },
  {
    date: "2026-10-29",
    tag: "更新",
    title: "2026年10月29日更新",
    link: "news/2026-10-29-update.html"
  },
  {
    date: "2026-10-25",
    tag: "更新",
    title: "2026年10月25日更新",
    link: "news/2026-10-25-update.html"
  },
  {
    date: "2026-10-24",
    tag: "更新",
    title: "2026年10月24日更新",
    link: "news/2026-10-24-update.html"
  },
  {
    date: "2026-10-23",
    tag: "更新",
    title: "2026年10月23日更新",
    link: "news/2026-10-23-update.html"
  },
  {
    date: "2026-10-22",
    tag: "更新",
    title: "2026年10月22日更新",
    link: "news/2026-10-22-update.html"
  },
  {
    date: "2026-10-19",
    tag: "更新",
    title: "2026年10月19日更新",
    link: "news/2026-10-19-update.html"
  },
  {
    date: "2026-10-14",
    tag: "更新",
    title: "2026年10月14日更新",
    link: "news/2026-10-14-update.html"
  },
  {
    date: "2026-10-13",
    tag: "更新",
    title: "2026年10月13日更新",
    link: "news/2026-10-13-update.html"
  },
  {
    date: "2026-10-12",
    tag: "更新",
    title: "2026年10月12日更新",
    link: "news/2026-10-12-update.html"
  },
  {
    date: "2026-09-25",
    tag: "更新",
    title: "2026年9月25日更新",
    link: "news/2026-09-25-update.html"
  },
  {
    date: "2026-09-24",
    tag: "更新",
    title: "2026年9月24日更新",
    link: "news/2026-09-24-update.html"
  },
  {
    date: "2026-09-23",
    tag: "更新",
    title: "2026年9月23日更新",
    link: "news/2026-09-23-update.html"
  },
  {
    date: "2026-09-23",
    tag: "活动",
    title: "中秋活动：山河入梦图（9月23日至10月7日，每晚22:00–24:00）",
    link: "news/2026-09-23-mid-autumn.html"
  },
  {
    date: "2026-09-21",
    tag: "更新",
    title: "2026年9月21日更新",
    link: "news/2026-09-21-update.html"
  },
  {
    date: "2026-09-20",
    tag: "更新",
    title: "2026年9月20日更新",
    link: "news/2026-09-20-update.html"
  },
  {
    date: "2026-09-19",
    tag: "更新",
    title: "2026年9月19日更新",
    link: "news/2026-09-19-update.html"
  },
  {
    date: "2026-09-18",
    tag: "更新",
    title: "2026年9月18日更新",
    link: "news/2026-09-18-update.html"
  },
  {
    date: "2026-09-17",
    tag: "更新",
    title: "2026年9月17日更新",
    link: "news/2026-09-17-update.html"
  },
  {
    date: "2026-09-16",
    tag: "更新",
    title: "2026年9月16日更新",
    link: "news/2026-09-16-update.html"
  },
  {
    date: "2026-09-15",
    tag: "更新",
    title: "2026年9月15日更新",
    link: "news/2026-09-15-update.html"
  },
  {
    date: "2026-09-14",
    tag: "更新",
    title: "2026年9月14日更新",
    link: "news/2026-09-14-update.html"
  },
  {
    date: "2026-09-13",
    tag: "维护",
    title: "2026年9月13日维护",
    link: "news/2026-09-13-maintenance.html"
  },
  {
    date: "2026-09-13",
    tag: "更新",
    title: "2026年9月13日更新",
    link: "news/2026-09-13-update-606.html"
  },
  {
    date: "2026-09-12",
    tag: "维护",
    title: "晚间维护：修复战斗异常，并同步游戏服调整。维护结束后即可登录。",
    link: "news/2026-09-12-maintenance.html"
  },
  {
    date: "2026-09-12",
    tag: "更新",
    title: "版本 6.0.5：修复海底迷宫等地图背景音乐导致的进游戏闪退；修复魔王寨战斗崩溃；修复花果山如意神通无法正常刷新；创建帮派银子调整为 100 万。",
    link: "news/2026-09-12-update-605.html"
  },
  {
    date: "2026-07-19",
    tag: "公告",
    title: "《玄梦》ONLINE 官方网站正式上线，客户端开放下载",
    link: "news/2026-07-19-official-launch.html"
  },
  {
    date: "2026-07-18",
    tag: "更新",
    title: "版本更新：仙玉商城、召唤兽梦影「青花古韵·水墨灵秀」正式开放"
  },
  {
    date: "2026-07-16",
    tag: "活动",
    title: "限时活动预告：门派闯关、降妖伏魔、天降辰星每日开启"
  },
  {
    date: "2026-07-15",
    tag: "更新",
    title: "归墟秘境系列副本开放：共生、激战、悟空、应变四境试炼"
  },
  {
    date: "2026-07-14",
    tag: "活动",
    title: "长安保卫战每周一、三、五 19:30 开战，守卫长安赢丰厚奖励"
  },
  {
    date: "2026-07-12",
    tag: "公告",
    title: "锦衣「千色汇」染色系统说明：海量配色随心搭配"
  },
  {
    date: "2026-07-10",
    tag: "维护",
    title: "例行维护公告：服务器优化维护，提升游戏稳定性"
  },
  {
    date: "2026-07-08",
    tag: "活动",
    title: "剑会比武每晚 21:00 开启，与三界豪杰一较高下"
  }
];
