// 全屏水墨遮罩：墨滴晕开时露出页面，边缘带一圈泥金。
// 进站与切页共用。不依赖 three.js，保证它在所有资源之前就能跑起来。
import gsap from 'gsap';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uP;
uniform float uT;
uniform vec2 uC;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for(int i = 0; i < 6; i++){ v += a*noise(p); p = p*2.03 + 17.; a *= .5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 asp = vec2(uRes.x/uRes.y, 1.);
  vec2 p = uv*asp;

  // 主墨滴加两朵伴生的小墨，晕开不是一个正圆
  float n = fbm(p*2.6 + uT*.04);
  float m = fbm(p*7.0 - uT*.03);
  float d1 = length(p - uC*asp);
  float d2 = length(p - (uC + vec2(.28, -.2))*asp) + .34;
  float d3 = length(p - (uC + vec2(-.3, .16))*asp) + .48;
  float d = min(d1, min(d2, d3));
  d += (n - .5)*.55 + (m - .5)*.11;

  float maxR = length(asp) * 1.45;
  float edge = uP * maxR - .12;

  float hole = smoothstep(edge - .012, edge + .006, d);

  // 玄青墨底，略带石青的层次
  vec3 ink = mix(vec3(.027,.063,.118), vec3(.043,.106,.2), fbm(p*1.4 + 3.));
  ink *= .78 + .35*m;

  // 泥金描边：墨线外沿烧出一圈金
  float band = 1. - smoothstep(.0, .085, abs(d - edge - .03));
  vec3 gold = mix(vec3(.72,.5,.2), vec3(1.,.9,.62), n);
  vec3 col = mix(ink, gold*1.15, band*band*.95);

  gl_FragColor = vec4(col*hole, hole);
}`;

export interface InkWash {
  canvas: HTMLCanvasElement;
  /** 打开：墨散开露出页面 */
  reveal(opts?: { from?: [number, number]; duration?: number }): Promise<void>;
  /** 合上：墨从一点漫到全屏 */
  cover(opts?: { from?: [number, number]; duration?: number }): Promise<void>;
  /** 立即铺满，不做动画 */
  fill(): void;
}

export function createInk(canvas: HTMLCanvasElement): InkWash | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uP = gl.getUniformLocation(prog, 'uP');
  const uT = gl.getUniformLocation(prog, 'uT');
  const uC = gl.getUniformLocation(prog, 'uC');
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const state = { p: 0, cx: 0.5, cy: 0.5 };
  const t0 = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  };

  const draw = () => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uP, state.p);
    gl.uniform1f(uT, (performance.now() - t0) / 1000);
    gl.uniform2f(uC, state.cx, state.cy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  resize();
  window.addEventListener('resize', () => {
    resize();
    draw();
  });

  const run = (to: number, from: [number, number] | undefined, duration: number, ease: string) =>
    new Promise<void>((done) => {
      if (from) {
        state.cx = from[0];
        state.cy = from[1];
      }
      gsap.to(state, { p: to, duration, ease, onUpdate: draw, onComplete: () => { draw(); done(); } });
    });

  return {
    canvas,
    // reveal：洞从 0 长到全屏；cover：洞从全屏缩回 0
    reveal: ({ from, duration = 2.1 } = {}) => {
      state.p = 0;
      canvas.style.display = 'block';
      return run(1, from, duration, 'power2.inOut').then(() => {
        canvas.style.display = 'none';
      });
    },
    cover: ({ from, duration = 0.85 } = {}) => {
      state.p = 1;
      canvas.style.display = 'block';
      return run(0, from, duration, 'power2.in');
    },
    fill: () => {
      state.p = 0;
      canvas.style.display = 'block';
      draw();
    },
  };
}
