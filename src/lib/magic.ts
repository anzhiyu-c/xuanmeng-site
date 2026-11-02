// 法阵：三层描金细线圆环，角色和灵兽身后共用
let uid = 0;

const polar = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
};

const ticks = (r: number, n: number, len: number) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const deg = (i / n) * 360;
    const [x0, y0] = polar(r, deg);
    const [x1, y1] = polar(r + (i % 4 === 0 ? len * 2 : len), deg);
    d += `M${x0} ${y0}L${x1} ${y1}`;
  }
  return d;
};

const star = (r: number, n: number, skip: number) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const [x, y] = polar(r, ((i * skip) / n) * 360);
    d += `${i ? 'L' : 'M'}${x} ${y}`;
  }
  return `${d}Z`;
};

const orbs = (r: number, n: number, size: number) =>
  Array.from({ length: n }, (_, i) => {
    const [x, y] = polar(r, (i / n) * 360);
    return `<circle cx="${x}" cy="${y}" r="${size}" />`;
  }).join('');

export function magicCircle(className = '') {
  const id = `mg${++uid}`;
  return `
    <div class="magic ${className}" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#e9d6a3" />
            <stop offset=".5" stop-color="#b8924a" />
            <stop offset="1" stop-color="#f1e0b4" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#${id})" stroke-width=".35">
          <g class="m-a">
            <circle cx="100" cy="100" r="98" />
            <circle cx="100" cy="100" r="90" />
            <path d="${ticks(90, 72, 3.2)}" />
            <g fill="url(#${id})" stroke="none">${orbs(94, 12, 1.5)}</g>
          </g>
          <g class="m-b">
            <circle cx="100" cy="100" r="74" stroke-width=".5" />
            <path d="${star(74, 7, 3)}" />
          </g>
          <g class="m-c">
            <circle cx="100" cy="100" r="46" />
            <path d="${star(46, 5, 2)}" />
            <path d="${ticks(46, 40, 2.4)}" />
          </g>
        </g>
      </svg>
    </div>`;
}
