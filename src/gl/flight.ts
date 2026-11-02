// 三界穿行：滚动驱动相机穿过分层绘制的场景，角色飘在镜头前。
// 仙 → 人 → 魔，每次换界相机前冲，画面径向拉长，柔和地白场进入下一界。
// 整个画面先渲染到离屏，再过一道很轻的后期：泛光和暗角。
import * as THREE from 'three';

export interface LayerDef {
  src: string;
  /** 初始时与相机的距离 */
  depth: number;
  /** 平面高度，占该距离视锥高度的比例 */
  h: number;
  /** 中心位置，单位是该距离的视锥高度 */
  x?: number;
  y?: number;
  /** 大气透视的雾浓度 0-1 */
  fog?: number;
  /** 背景层：始终铺满视口 */
  cover?: boolean;
  /** 首屏时隐藏，开始滚动后才淡入，让首屏只留干净的天和云 */
  hideAtStart?: boolean;
  /** 相机前进时这一层接近镜头的比例，默认 1；角色调小，免得一下子穿过镜头 */
  speed?: number;
  /** 上下飘动的幅度，单位同 y */
  bob?: number;
  /** 首屏入场：从偏移处滑入，delay 为秒 */
  enter?: { x: number; y: number; delay: number };
  /** 竖屏时的位置和大小 */
  portrait?: { x?: number; y?: number; h?: number };
}

export interface ChapterDef {
  key: 'xian' | 'ren' | 'mo';
  layers: LayerDef[];
  travel: number;
  fog: string;
  dust: string;
  /** 粒子上升速度 */
  rise: number;
  /** 光源：屏幕位置(-1..1)、颜色、强度 */
  light: { x: number; y: number; color: string; power: number };
}

export interface TitleDef {
  src: string;
  depth: number;
  h: number;
  x: number;
  y: number;
  portrait?: { x?: number; y?: number; h?: number };
}

const FOV = 38;
const frustumH = (d: number) => 2 * d * Math.tan(THREE.MathUtils.degToRad(FOV / 2));

const NOISE = /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for(int i = 0; i < 5; i++){ v += a*noise(p); p = p*2.03 + 17.; a *= .5; }
  return v;
}
`;

const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`;

// 画面层：叠雾
const PLANE_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uFogColor;
uniform float uFog, uOpacity;
varying vec2 vUv;
void main(){
  vec4 t = texture2D(uMap, vUv);
  gl_FragColor = vec4(mix(t.rgb, uFogColor, uFog), t.a*uOpacity);
}`;

// 标题：抛光金属。用透明度和亮度的梯度当凹凸，高光跟随鼠标，每隔几秒一道很慢的光扫过字面
const TITLE_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity, uT, uReveal;
uniform vec2 uMouse, uTexel;
varying vec2 vUv;
${NOISE}
void main(){
  vec4 t = texture2D(uMap, vUv);
  float e = 2.4;
  vec2 dv = vec2(uTexel.x*e, 0.), dh = vec2(0., uTexel.y*e);
  float dx = texture2D(uMap, vUv + dv).a - texture2D(uMap, vUv - dv).a;
  float dy = texture2D(uMap, vUv + dh).a - texture2D(uMap, vUv - dh).a;
  vec3 n = normalize(vec3(dx*2., dy*2., 1.));
  vec3 l = normalize(vec3(uMouse*1.1 + vec2(sin(uT*.3), cos(uT*.23))*.3, .9));
  float spec = pow(max(dot(reflect(-l, n), vec3(0.,0.,1.)), 0.), 26.);
  vec3 col = t.rgb + spec*vec3(1.,.96,.86)*.35;

  float s = fract(uT*.085)*3.4 - 1.2;
  col += smoothstep(.16, .0, abs(vUv.x + vUv.y*.45 - s))*.34;

  // 入场：从左往右柔和地显现
  float m = vUv.x*.8 + (1. - vUv.y)*.2;
  float front = uReveal*1.5 - .25;
  float shown = 1. - smoothstep(front - .1, front + .06, m);
  gl_FragColor = vec4(col, t.a*shown*uOpacity);
}`;

// 光束：以光源为中心的放射状噪声
const SHAFT_FRAG = /* glsl */ `
uniform vec2 uL;
uniform vec3 uColor;
uniform float uPower, uT, uAsp;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = (vUv*2.-1.); p.x *= uAsp;
  vec2 d = p - vec2(uL.x*uAsp, uL.y);
  float r = length(d);
  float ang = atan(d.y, d.x);
  float rays = fbm(vec2(ang*5.5, uT*.05))*fbm(vec2(ang*13. - uT*.03, 3.));
  float v = (pow(rays, 1.5)*2.4*exp(-r*.55) + exp(-r*1.15)*.42)*uPower;
  gl_FragColor = vec4(uColor*v, 1.);
}`;

const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy*2., 0., 1.); }`;

// 首屏衬底：横屏从左侧、竖屏从底部铺一层珍珠色，文字和标题才压得住画面
const VEIL_FRAG = /* glsl */ `
uniform float uOpacity, uPortrait;
varying vec2 vUv;
void main(){
  float side = 1. - smoothstep(.04, .52, vUv.x);
  float bottom = 1. - smoothstep(.06, .44, vUv.y);
  float a = mix(side*.5, bottom*.9, uPortrait);
  gl_FragColor = vec4(.973, .969, .945, a*uOpacity);
}`;

// 后期：泛光用离屏贴图的多级纹理近似，跃迁时做径向模糊
const POST_FRAG = /* glsl */ `
uniform sampler2D uScene;
uniform float uWarp, uFlash, uBloom, uAsp;
uniform vec3 uTint;
varying vec2 vUv;
void main(){
  vec2 c = vUv - .5;
  float r = length(c*vec2(uAsp, 1.));

  vec3 col;
  if(uWarp > .002){
    // 每个像素的采样起点错开一点，把条纹打散成看不见的细颗粒
    float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)))*43758.5453);
    col = vec3(0.);
    for(int i = 0; i < 12; i++){
      col += texture2D(uScene, .5 + c*(1. - uWarp*.3*(float(i) + jitter)/12.)).rgb;
    }
    col /= 12.;
  } else {
    col = texture2D(uScene, vUv).rgb;
  }

  // 泛光：只让最亮的部分微微晕开
  if(uBloom > .001){
    vec3 glow = texture2D(uScene, vUv, 3.4).rgb*.5 + texture2D(uScene, vUv, 5.).rgb*.5;
    glow = max(glow - .72, 0.)*1.5;
    col = 1. - (1. - col)*(1. - glow*uBloom);
  }

  // 很淡的暗角，把视线收向中央
  col *= 1. - smoothstep(.55, 1.05, r)*.16;

  col = mix(col, uTint, uFlash);
  gl_FragColor = vec4(col, 1.);
}`;

const DUST_VERT = /* glsl */ `
attribute vec3 aSeed;
uniform float uT, uRise, uPx, uAsp;
uniform vec3 uCam;
uniform vec2 uMouse;
varying float vA;
void main(){
  vec3 box = vec3(80., 46., 70.);
  vec3 p = position;
  p.x += sin(uT*.21 + aSeed.x*6.28)*1.6;
  p.y += uT*uRise*(.4 + aSeed.z) + cos(uT*.18 + aSeed.y*6.28)*1.1;
  vec3 rel = mod(p - uCam, box) - box*.5;
  rel.z -= box.z*.5;
  // 鼠标搅动近处的光点
  float near = smoothstep(-34., -6., rel.z);
  rel.xy += uMouse*near*2.4;
  vec4 mv = viewMatrix * vec4(uCam + rel, 1.);
  gl_Position = projectionMatrix * mv;
  float tw = .55 + .45*sin(uT*(.25 + aSeed.x*.4) + aSeed.z*40.);
  gl_PointSize = uPx*(1. + aSeed.y*2.6)*(26./max(-mv.z, 1.));
  vA = tw*smoothstep(-62., -30., rel.z)*(1. - smoothstep(-6., -1., rel.z));
}`;

// 柔和的圆形光点
const DUST_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOp;
varying float vA;
void main(){
  float d = length(gl_PointCoord - .5);
  float soft = 1. - smoothstep(.0, .5, d);
  gl_FragColor = vec4(uColor*soft*soft*vA*uOp, 1.);
}`;

export interface Flight {
  update(scroll: number): void;
  setMouse(x: number, y: number): void;
  loadChapter(i: number, onProgress?: (done: number, total: number) => void): Promise<void>;
  revealTitle(duration: number): Promise<void>;
  /** 让首屏角色滑入 */
  playEnter(): void;
  /** 当前显示的界 0 仙 1 人 2 魔 */
  readonly active: number;
  render(t: number): void;
  resize(): void;
}

type MeshEntry = {
  def: LayerDef;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  aspect: number;
  phase: number;
  base: { x: number; y: number; sx: number; sy: number; fh: number };
};

const BOUNDS = [0.335, 0.665];
const TRANSITION = 0.052;

const expoOut = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));

export function createFlight(canvas: HTMLCanvasElement, chapters: ChapterDef[], title?: TitleDef): Flight | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0xdfe7f3, 1);
  const isSmall = () => window.innerWidth < 768;
  const useBloom = !isSmall();
  let dpr = Math.min(window.devicePixelRatio || 1, isSmall() ? 1.25 : 1.75);
  renderer.setPixelRatio(dpr);

  const target3d = new THREE.WebGLRenderTarget(4, 4, {
    depthBuffer: false,
    generateMipmaps: useBloom,
    minFilter: useBloom ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 600);

  const plane = new THREE.PlaneGeometry(1, 1);
  const loader = new THREE.TextureLoader();
  const groups = chapters.map(() => new THREE.Group());
  groups.forEach((g) => {
    g.visible = false;
    scene.add(g);
  });
  groups[0].visible = true;

  const mouseU = { value: new THREE.Vector2() };
  const timeU = { value: 0 };

  const entries: MeshEntry[][] = chapters.map((ch, ci) =>
    ch.layers.map((def, li) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: PLANE_VERT,
        fragmentShader: PLANE_FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uMap: { value: null },
          uFogColor: { value: new THREE.Color(ch.fog) },
          uFog: { value: def.fog ?? 0 },
          uOpacity: { value: 1 },
        },
      });
      const mesh = new THREE.Mesh(plane, mat);
      mesh.visible = false;
      mesh.renderOrder = li < 1 ? 0 : 10 + li;
      mesh.frustumCulled = false;
      groups[ci].add(mesh);
      return { def, mesh, mat, aspect: 1, phase: li * 1.7, base: { x: 0, y: 0, sx: 1, sy: 1, fh: 1 } };
    }),
  );

  // 光束
  const shaftMat = new THREE.ShaderMaterial({
    vertexShader: SCREEN_VERT,
    fragmentShader: SHAFT_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uL: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color() },
      uPower: { value: 0 },
      uT: timeU,
      uAsp: { value: 1 },
    },
  });
  const shaft = new THREE.Mesh(plane, shaftMat);
  shaft.frustumCulled = false;
  shaft.renderOrder = 5;
  shaft.scale.set(2, 2, 1);
  scene.add(shaft);

  // 漂浮的光点
  const count = isSmall() ? 140 : 420;
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = Math.random() * 80;
    pos[i * 3 + 1] = Math.random() * 46;
    pos[i * 3 + 2] = Math.random() * 70;
    seed[i * 3] = Math.random();
    seed[i * 3 + 1] = Math.random();
    seed[i * 3 + 2] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  const dustMat = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uT: timeU,
      uRise: { value: 0.4 },
      uPx: { value: 1 },
      uAsp: { value: 1 },
      uCam: { value: new THREE.Vector3() },
      uMouse: mouseU,
      uColor: { value: new THREE.Color(chapters[0].dust) },
      uOp: { value: 0.5 },
    },
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  dust.renderOrder = 60;
  scene.add(dust);

  // 后期
  const postMat = new THREE.ShaderMaterial({
    vertexShader: SCREEN_VERT,
    fragmentShader: POST_FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uScene: { value: target3d.texture },
      uWarp: { value: 0 },
      uFlash: { value: 0 },
      uBloom: { value: useBloom ? 0.5 : 0 },
      uAsp: { value: 1 },
      uTint: { value: new THREE.Color('#ffffff') },
    },
  });
  const postScene = new THREE.Scene();
  const postQuad = new THREE.Mesh(plane, postMat);
  postQuad.frustumCulled = false;
  postScene.add(postQuad);
  const postCam = new THREE.Camera();

  // 首屏衬底
  const veilMat = new THREE.ShaderMaterial({
    vertexShader: SCREEN_VERT,
    fragmentShader: VEIL_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: { uOpacity: { value: 1 }, uPortrait: { value: 0 } },
  });
  const veil = new THREE.Mesh(plane, veilMat);
  veil.frustumCulled = false;
  veil.renderOrder = 65;
  groups[0].add(veil);

  // 标题
  let titleMesh: THREE.Mesh | null = null;
  let titleMat: THREE.ShaderMaterial | null = null;
  let titleAspect = 1;
  const titleState = { reveal: 0 };
  if (title) {
    titleMat = new THREE.ShaderMaterial({
      vertexShader: PLANE_VERT,
      fragmentShader: TITLE_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uMap: { value: null },
        uOpacity: { value: 1 },
        uT: timeU,
        uReveal: { value: 0 },
        uMouse: mouseU,
        uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
      },
    });
    titleMesh = new THREE.Mesh(plane, titleMat);
    titleMesh.renderOrder = 70;
    titleMesh.visible = false;
    titleMesh.frustumCulled = false;
    groups[0].add(titleMesh);
  }

  const loadTex = async (src: string) => {
    const tex = await loader.loadAsync(src);
    tex.colorSpace = THREE.NoColorSpace;
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  };

  const layout = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const asp = w / h;
    camera.aspect = asp;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    const pr = renderer.getPixelRatio();
    target3d.setSize(Math.max(4, Math.round(w * pr)), Math.max(4, Math.round(h * pr)));
    shaftMat.uniforms.uAsp.value = asp;
    postMat.uniforms.uAsp.value = asp;
    dustMat.uniforms.uPx.value = pr * (isSmall() ? 1.5 : 1);
    const portrait = asp < 1;
    veilMat.uniforms.uPortrait.value = portrait ? 1 : 0;
    // 竖屏时画面左右被裁切，把偏移收回中央，避免主体跑出屏幕
    const squeeze = Math.min(1, asp / 1.5);
    const widen = Math.max(1, asp / 1.75);
    entries.forEach((list) =>
      list.forEach((en) => {
        const fh = frustumH(en.def.depth);
        const p = portrait ? en.def.portrait : undefined;
        let height = (p?.h ?? en.def.h) * fh * widen;
        if (en.def.cover) {
          const coverW = fh * asp * 1.12;
          const coverH = fh * 1.12;
          height = Math.max(coverH, coverW / en.aspect);
        }
        en.base = {
          x: (p?.x ?? en.def.x ?? 0) * fh * (p ? 1 : squeeze),
          y: (p?.y ?? en.def.y ?? 0) * fh,
          sx: height * en.aspect,
          sy: height,
          fh,
        };
        en.mesh.scale.set(en.base.sx, en.base.sy, 1);
        en.mesh.position.set(en.base.x, en.base.y, -en.def.depth);
      }),
    );
    if (title && titleMesh) {
      const fh = frustumH(title.depth);
      const p = portrait ? title.portrait : undefined;
      const height = Math.min((p?.h ?? title.h) * fh, (fh * asp * (p ? 0.82 : 0.5)) / titleAspect);
      titleMesh.scale.set(height * titleAspect, height, 1);
      titleMesh.position.set((p?.x ?? title.x) * fh * (p ? 1 : squeeze), (p?.y ?? title.y) * fh, -title.depth);
    }
  };

  let activeIndex = 0;
  let scroll = 0;
  let enterAt = -1;
  const target = new THREE.Vector2();
  const eased = new THREE.Vector2();
  let frames = 0;
  let last = 0;
  let acc = 0;

  const chapterOf = (s: number) => (s < BOUNDS[0] ? 0 : s < BOUNDS[1] ? 1 : 2);

  const applyScroll = (t: number) => {
    const s = scroll;
    const ranges: [number, number][] = [
      [0, BOUNDS[0]],
      [BOUNDS[0], BOUNDS[1]],
      [BOUNDS[1], 1],
    ];
    const ci = chapterOf(s);
    if (ci !== activeIndex) {
      groups[activeIndex].visible = false;
      groups[ci].visible = true;
      activeIndex = ci;
    }
    const ch = chapters[ci];
    const [a, b] = ranges[ci];
    const p = (s - a) / (b - a);

    // 跃迁：换界前后相机加速前冲，画面拉丝，最亮的时候切换场景
    let u = 0;
    BOUNDS.forEach((bound) => {
      if (Math.abs(s - bound) < TRANSITION) u = 1 - Math.abs(s - bound) / TRANSITION;
    });
    const rush = ci < 2 && s > BOUNDS[ci] - TRANSITION ? (s - (BOUNDS[ci] - TRANSITION)) / TRANSITION : 0;

    const z = -ch.travel * p - rush * rush * 14;
    camera.position.set(eased.x * 1.5, eased.y * 0.9, z);
    camera.lookAt(eased.x * 0.25, eased.y * 0.12, z - 60);

    dustMat.uniforms.uCam.value.copy(camera.position);
    dustMat.uniforms.uColor.value.set(ch.dust);
    dustMat.uniforms.uRise.value = ch.rise;

    shaftMat.uniforms.uL.value.set(ch.light.x, ch.light.y);
    shaftMat.uniforms.uColor.value.set(ch.light.color);
    shaftMat.uniforms.uPower.value = ch.light.power;

    postMat.uniforms.uWarp.value = u * u;
    postMat.uniforms.uFlash.value = THREE.MathUtils.smoothstep(u, 0.55, 0.98);

    const enterT = enterAt < 0 ? -1 : t - enterAt;
    entries[ci].forEach((en) => {
      const speed = en.def.speed ?? 1;
      const d = en.def.depth + z * speed;
      const fade = en.def.cover ? 1 : THREE.MathUtils.smoothstep(d, 1.5, 9);
      let k = 1;
      if (en.def.enter && ci === 0) {
        const e = en.def.enter;
        k = enterT < 0 ? 0 : THREE.MathUtils.clamp((enterT - e.delay) / 1.9, 0, 1);
        const pop = expoOut(k);
        en.mesh.position.x = en.base.x + (1 - pop) * e.x * en.base.fh;
        en.mesh.position.y = en.base.y + (1 - pop) * e.y * en.base.fh;
        en.mesh.scale.set(en.base.sx * (0.9 + pop * 0.1), en.base.sy * (0.9 + pop * 0.1), 1);
      } else {
        en.mesh.position.x = en.base.x;
        en.mesh.position.y = en.base.y;
      }
      en.mesh.position.z = -en.def.depth + z * (1 - speed);
      if (en.def.bob) en.mesh.position.y += Math.sin(t * 0.8 + en.phase) * en.def.bob * en.base.fh;
      // 云和远景极慢地左右漂移，画面始终是活的，但察觉不到在动
      else if (!en.def.cover) en.mesh.position.x += Math.sin(t * 0.1 + en.phase) * 0.006 * en.base.fh;
      const reveal = en.def.hideAtStart ? THREE.MathUtils.smoothstep(-z, 3, 8) : 1;
      en.mat.uniforms.uOpacity.value = fade * reveal * Math.min(1, k * 2.4);
    });
    if (titleMesh && titleMat && title) {
      const d = title.depth + z;
      titleMat.uniforms.uOpacity.value = THREE.MathUtils.smoothstep(d, 27, 38);
    }
    // 衬底随首屏文字一起退去
    veilMat.uniforms.uOpacity.value = 1 - THREE.MathUtils.smoothstep(-z, 0, 7);
  };

  layout();
  window.addEventListener('resize', layout);

  return {
    get active() {
      return activeIndex;
    },
    update(s) {
      scroll = THREE.MathUtils.clamp(s, 0, 1);
    },
    setMouse(x, y) {
      target.set(x, y);
    },
    async loadChapter(i, onProgress) {
      const list = entries[i];
      const total = list.length + (i === 0 && title ? 1 : 0);
      let done = 0;
      const tick = () => onProgress?.(++done, total);
      const jobs = list.map(async (en) => {
        // 单张图失败只少一层画面，不能让整页卡在进度上
        try {
          const tex = await loadTex(en.def.src);
          const img = tex.image as HTMLImageElement;
          en.aspect = img.width / img.height;
          en.mat.uniforms.uMap.value = tex;
          en.mesh.visible = true;
          renderer.initTexture(tex);
        } catch {
          console.warn(`场景图加载失败：${en.def.src}`);
        }
        tick();
      });
      if (i === 0 && title && titleMat && titleMesh) {
        const mat = titleMat;
        const mesh = titleMesh;
        jobs.push(
          (async () => {
            try {
              const tex = await loadTex(title.src);
              const img = tex.image as HTMLImageElement;
              titleAspect = img.width / img.height;
              mat.uniforms.uMap.value = tex;
              mat.uniforms.uTexel.value.set(1 / img.width, 1 / img.height);
              mesh.visible = true;
              renderer.initTexture(tex);
            } catch {
              console.warn(`标题图加载失败：${title.src}`);
            }
            tick();
          })(),
        );
      }
      await Promise.all(jobs);
      layout();
    },
    revealTitle(duration) {
      return new Promise((done) => {
        const start = performance.now();
        const step = () => {
          const k = Math.min(1, (performance.now() - start) / (duration * 1000));
          titleState.reveal = k * k * (3 - 2 * k);
          if (titleMat) titleMat.uniforms.uReveal.value = titleState.reveal;
          if (k < 1) requestAnimationFrame(step);
          else done();
        };
        step();
      });
    },
    playEnter() {
      enterAt = timeU.value;
    },
    render(t) {
      timeU.value = t;
      eased.lerp(target, 0.055);
      mouseU.value.copy(eased);
      applyScroll(t);
      renderer.setRenderTarget(target3d);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);

      // 帧率不够时降分辨率，优先保证流畅
      if (last) {
        acc += t - last;
        frames += 1;
        if (frames >= 45) {
          const avg = acc / frames;
          if (avg > 0.03 && dpr > 0.85) {
            dpr = Math.max(0.85, dpr * 0.82);
            renderer.setPixelRatio(dpr);
            layout();
          }
          frames = 0;
          acc = 0;
        }
      }
      last = t;
    },
    resize: layout,
  };
}
