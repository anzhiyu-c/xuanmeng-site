// 三界穿行：滚动驱动相机穿过分层绘制的场景。
// 仙 → 人 → 魔，每次换界由一道“层云”遮住镜头，同时相机下坠。
import * as THREE from 'three';
import { sceneImg } from '../data/assets';

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
  /** 云层的水平漂移速度 */
  drift?: number;
  /** 亮度转透明（黑底绘制的云） */
  lumaAlpha?: boolean;
  /** 泥金笔触的闪烁强度，只给近景用 */
  glint?: number;
  /** 乘性调色：把大亮的绘画压成适合压字的影调 */
  grade?: string;
}

export interface ChapterDef {
  key: 'xian' | 'ren' | 'mo';
  layers: LayerDef[];
  travel: number;
  fog: string;
  dust: string;
  /** 粒子上升速度，魔界的余烬升得更快 */
  rise: number;
  /** 光束：屏幕位置(-1..1)、颜色、强度 */
  light: { x: number; y: number; color: string; power: number };
}

export interface TitleDef {
  src: string;
  depth: number;
  h: number;
  y: number;
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
}`;

const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`;

// 画面层：叠雾，并让泥金的笔触随时间与鼠标闪烁
const PLANE_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uFogColor;
uniform float uFog, uOpacity, uT, uLuma, uGlint;
uniform vec3 uGrade;
uniform vec2 uMouse, uDrift;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 uv = vUv + uDrift;
  vec4 t = texture2D(uMap, uv);
  float a = t.a;
  if(uLuma > .5){
    a = smoothstep(.04, .62, dot(t.rgb, vec3(.33)));
    t.rgb = mix(t.rgb, vec3(1.), .25);
  }
  float lum = dot(t.rgb, vec3(.3,.59,.11));
  float goldness = smoothstep(.22, .46, t.r - t.b) * smoothstep(.42, .7, lum);
  float glint = pow(noise(uv*vec2(260.,150.) + uT*.35 + uMouse*5.), 12.) * 3.2;
  vec3 col = t.rgb*uGrade + goldness*glint*uGlint*vec3(1.,.8,.42);
  col = mix(col, uFogColor, uFog);
  gl_FragColor = vec4(col, a*uOpacity);
}`;

// 标题：金箔。用透明度的梯度当作凹凸，鼠标就是光源
const TITLE_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity, uT, uReveal;
uniform vec2 uMouse, uTexel;
varying vec2 vUv;
${NOISE}
void main(){
  vec4 t = texture2D(uMap, vUv);
  float a = t.a;
  float e = 2.4;
  float dx = texture2D(uMap, vUv + vec2(uTexel.x*e, 0.)).a - texture2D(uMap, vUv - vec2(uTexel.x*e, 0.)).a;
  float dy = texture2D(uMap, vUv + vec2(0., uTexel.y*e)).a - texture2D(uMap, vUv - vec2(0., uTexel.y*e)).a;
  float crackle = fbm(vUv*vec2(30.,40.));
  vec3 n = normalize(vec3(dx*2.6 + (crackle-.5)*.32, dy*2.6 + (fbm(vUv*vec2(38.,26.)+9.)-.5)*.32, 1.));
  vec3 l = normalize(vec3(uMouse*1.3 + vec2(sin(uT*.42), cos(uT*.31))*.35, .85));
  float diff = dot(n, l)*.5 + .5;
  float spec = pow(max(dot(reflect(-l, n), vec3(0.,0.,1.)), 0.), 34.);
  // 保留 Logo 自身的金色细节，只叠加光照
  vec3 gold = t.rgb*mix(.72, 1.08, smoothstep(.25,.95,diff));
  gold += pow(spec, 1.6)*vec3(1.,.9,.62)*.55;

  // 毛笔扫出：从右上往左下
  float path = (1.-vUv.x)*.7 + (1.-vUv.y)*.3;
  float m = path + (fbm(vUv*7.)-.5)*.28;
  float front = uReveal*1.5 - .25;
  float shown = 1. - smoothstep(front-.05, front+.02, m);
  float hot = (1. - smoothstep(.0,.09,abs(m-front)))*step(uReveal,.999);
  gold += hot*vec3(1.,.82,.5)*1.4;
  gl_FragColor = vec4(gold, a*shown*uOpacity);
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
  float rays = fbm(vec2(ang*5.5, uT*.05)) * fbm(vec2(ang*13. - uT*.03, 3.));
  float glow = exp(-r*1.15);
  float v = (pow(rays, 1.5)*2.2*exp(-r*.62) + glow*.42)*uPower;
  gl_FragColor = vec4(uColor*v, 1.);
}`;

// 层云：三层手绘云墙以不同速度自下而上掠过镜头，近处的层最大也最快
const COVER_FRAG = /* glsl */ `
uniform sampler2D uCloud;
uniform float uU, uT, uAsp, uImgAsp;
uniform vec3 uFill;
varying vec2 vUv;

vec4 cloudLayer(vec2 uv, float speed, float scale, float xoff, float tone){
  float t = .5 + (uU - .5)*speed;
  float H = scale*uAsp/uImgAsp;
  float cy = mix(-H*.5, 1. + H*.5, t);
  float sway = sin(uT*.35 + xoff*6.)*.012;
  vec2 q = vec2((uv.x - .5)/scale + .5 + xoff + sway, (uv.y - cy)/H + .5);
  if(q.y < 0. || q.y > 1.) return vec4(0.);
  vec4 c = texture2D(uCloud, q);
  c.rgb *= tone;
  return c;
}
vec4 over(vec4 top, vec4 under){
  float a = top.a + under.a*(1. - top.a);
  if(a < .001) return vec4(0.);
  return vec4((top.rgb*top.a + under.rgb*under.a*(1. - top.a))/a, a);
}
void main(){
  // 云墙完全遮住画面的那一刻垫一层实色，换界不会露馅
  float fill = smoothstep(.44, .475, uU)*(1. - smoothstep(.525, .56, uU));
  vec4 col = vec4(uFill, fill);
  col = over(cloudLayer(vUv, 1., 1.32, .13, .7), col);
  col = over(cloudLayer(vUv, 1.28, 1.72, .41, .86), col);
  col = over(cloudLayer(vUv, 1.72, 2.4, .73, 1.), col);
  gl_FragColor = col;
}`;

const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy*2., 0., 1.); }`;

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
  // 鼠标搅动近处的金粉
  float near = smoothstep(-34., -6., rel.z);
  rel.xy += uMouse*near*2.4;
  vec4 mv = viewMatrix * vec4(uCam + rel, 1.);
  gl_Position = projectionMatrix * mv;
  float tw = .55 + .45*sin(uT*(1. + aSeed.x*2.) + aSeed.z*40.);
  gl_PointSize = uPx*(.6 + aSeed.y*2.4)*(22./max(-mv.z, 1.));
  vA = tw*smoothstep(-62., -30., rel.z)*(1. - smoothstep(-6., -1., rel.z));
}`;

const DUST_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOp;
varying float vA;
void main(){
  float d = length(gl_PointCoord - .5);
  float a = 1. - smoothstep(.0, .5, d);
  gl_FragColor = vec4(uColor*(a*a*1.6)*vA*uOp, 1.);
}`;

export interface Flight {
  update(scroll: number): void;
  setMouse(x: number, y: number): void;
  loadChapter(i: number, onProgress?: (done: number, total: number) => void): Promise<void>;
  revealTitle(duration: number): Promise<void>;
  /** 当前显示的界 0 仙 1 人 2 魔 */
  readonly active: number;
  render(t: number): void;
  resize(): void;
}

type MeshEntry = { def: LayerDef; mesh: THREE.Mesh; mat: THREE.ShaderMaterial; aspect: number; baseDrift: number };

const BOUNDS = [0.335, 0.665];
const TRANSITION = 0.052;

const COVERS = [
  { src: sceneImg('cloud_light'), fill: '#d6cfb6' },
  { src: sceneImg('cloud_dark'), fill: '#1a0a10' },
];

export function createFlight(canvas: HTMLCanvasElement, chapters: ChapterDef[], title?: TitleDef): Flight | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x081627, 1);
  const isSmall = () => window.innerWidth < 768;
  let dpr = Math.min(window.devicePixelRatio || 1, isSmall() ? 1.25 : 1.75);
  renderer.setPixelRatio(dpr);

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
          uT: timeU,
          uMouse: mouseU,
          uDrift: { value: new THREE.Vector2() },
          uLuma: { value: def.lumaAlpha ? 1 : 0 },
          uGlint: { value: def.glint ?? 0 },
          uGrade: { value: new THREE.Color(def.grade ?? '#ffffff') },
        },
      });
      const mesh = new THREE.Mesh(plane, mat);
      mesh.visible = false;
      mesh.renderOrder = li < 1 ? 0 : 10 + li;
      mesh.frustumCulled = false;
      groups[ci].add(mesh);
      return { def, mesh, mat, aspect: 1, baseDrift: def.drift ?? 0 };
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

  // 金粉与余烬
  const count = isSmall() ? 420 : 1400;
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
      uOp: { value: 1 },
    },
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  dust.renderOrder = 60;
  scene.add(dust);

  // 层云遮罩
  const coverMat = new THREE.ShaderMaterial({
    vertexShader: SCREEN_VERT,
    fragmentShader: COVER_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uCloud: { value: null },
      uU: { value: 0 },
      uT: timeU,
      uAsp: { value: 1 },
      uImgAsp: { value: 16 / 9 },
      uFill: { value: new THREE.Color() },
    },
  });
  const cover = new THREE.Mesh(plane, coverMat);
  cover.frustumCulled = false;
  cover.renderOrder = 90;
  cover.scale.set(2, 2, 1);
  cover.visible = false;
  scene.add(cover);

  // 标题后面垫一团玄青，金色才压得住明亮的云海
  const titleBackMat = new THREE.ShaderMaterial({
    vertexShader: PLANE_VERT,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec2 vUv;
      void main(){
        float d = length(vUv - .5)*2.;
        float a = 1. - smoothstep(.12, 1., d);
        gl_FragColor = vec4(.03, .085, .17, a*a*uOpacity);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: { uOpacity: { value: 0 } },
  });
  const titleBack = new THREE.Mesh(plane, titleBackMat);
  titleBack.renderOrder = 69;
  titleBack.frustumCulled = false;
  titleBack.visible = false;
  groups[0].add(titleBack);

  // 标题金箔
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

  const cloudTex: (THREE.Texture | null)[] = [null, null];
  const loadCloud = async (i: number) => {
    const tex = await loadTex(COVERS[i].src);
    tex.wrapS = THREE.MirroredRepeatWrapping;
    tex.needsUpdate = true;
    renderer.initTexture(tex);
    cloudTex[i] = tex;
  };

  const layout = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const asp = w / h;
    camera.aspect = asp;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    coverMat.uniforms.uAsp.value = asp;
    shaftMat.uniforms.uAsp.value = asp;
    dustMat.uniforms.uPx.value = renderer.getPixelRatio() * (isSmall() ? 1.5 : 1);
    // 竖屏时画面左右被裁切，把偏移收回中央，避免主体跑出屏幕
    const squeeze = Math.min(1, asp / 1.5);
    const widen = Math.max(1, asp / 1.75);
    entries.forEach((list) =>
      list.forEach((en) => {
        const fh = frustumH(en.def.depth);
        let height = en.def.h * fh * widen;
        if (en.def.cover) {
          const coverW = fh * asp * 1.12;
          const coverH = fh * 1.12;
          height = Math.max(coverH, coverW / en.aspect);
        }
        en.mesh.scale.set(height * en.aspect, height, 1);
        en.mesh.position.set((en.def.x ?? 0) * fh * squeeze, (en.def.y ?? 0) * fh, -en.def.depth);
      }),
    );
    if (title && titleMesh) {
      const fh = frustumH(title.depth);
      const height = Math.min(title.h * fh, (fh * asp * 0.8) / titleAspect);
      titleMesh.scale.set(height * titleAspect, height, 1);
      titleMesh.position.set(0, title.y * fh, -title.depth);
      titleBack.scale.set(height * titleAspect * 2.1, height * 1.9, 1);
      titleBack.position.copy(titleMesh.position);
    }
  };

  let activeIndex = 0;
  let scroll = 0;
  const target = new THREE.Vector2();
  const eased = new THREE.Vector2();
  let frames = 0;
  let last = 0;
  let acc = 0;

  const chapterOf = (s: number) => (s < BOUNDS[0] ? 0 : s < BOUNDS[1] ? 1 : 2);

  const applyScroll = () => {
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

    // 下坠：换界前后相机有一段竖直位移
    let fall = 0;
    if (ci < 2) {
      const near = THREE.MathUtils.clamp((s - (BOUNDS[ci] - TRANSITION)) / TRANSITION, 0, 1);
      fall -= near * near * 7;
    }
    if (ci > 0) {
      const near = 1 - THREE.MathUtils.clamp((s - BOUNDS[ci - 1]) / TRANSITION, 0, 1);
      fall += near * near * 7;
    }

    const z = -ch.travel * p;
    camera.position.set(eased.x * 1.5, eased.y * 0.9 + fall, z);
    camera.lookAt(eased.x * 0.25, eased.y * 0.12 + fall * 0.82, z - 60);

    dustMat.uniforms.uCam.value.copy(camera.position);
    dustMat.uniforms.uColor.value.set(ch.dust);
    dustMat.uniforms.uRise.value = ch.rise;

    shaftMat.uniforms.uL.value.set(ch.light.x, ch.light.y);
    shaftMat.uniforms.uColor.value.set(ch.light.color);
    shaftMat.uniforms.uPower.value = ch.light.power;

    // 靠近镜头的层渐隐，不会有穿模的硬边
    entries[ci].forEach((en) => {
      const d = en.def.depth + z;
      en.mat.uniforms.uOpacity.value = en.def.cover ? 1 : THREE.MathUtils.smoothstep(d, 1.5, 9);
    });
    if (titleMesh && titleMat && title) {
      const d = title.depth + z;
      const fade = THREE.MathUtils.smoothstep(d, 27, 38);
      titleMat.uniforms.uOpacity.value = fade;
      titleBackMat.uniforms.uOpacity.value = 0.6 * fade * titleState.reveal;
    }

    // 层云
    let u = -1;
    let which = 0;
    BOUNDS.forEach((bound, i) => {
      if (Math.abs(s - bound) < TRANSITION) {
        u = (s - (bound - TRANSITION)) / (TRANSITION * 2);
        which = i;
      }
    });
    const cloud = u >= 0 ? cloudTex[which] : null;
    cover.visible = u >= 0;
    if (u >= 0) {
      coverMat.uniforms.uU.value = u;
      coverMat.uniforms.uFill.value.set(COVERS[which].fill);
      if (cloud) {
        coverMat.uniforms.uCloud.value = cloud;
        const img = cloud.image as HTMLImageElement;
        coverMat.uniforms.uImgAsp.value = img.width / img.height;
      }
    }
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
      if (i < COVERS.length) void loadCloud(i);
      const list = entries[i];
      const total = list.length + (i === 0 && title ? 1 : 0);
      let done = 0;
      const tick = () => onProgress?.(++done, total);
      const jobs = list.map(async (en) => {
        const tex = await loadTex(en.def.src);
        const img = tex.image as HTMLImageElement;
        en.aspect = img.width / img.height;
        en.mat.uniforms.uMap.value = tex;
        en.mesh.visible = true;
        renderer.initTexture(tex);
        tick();
      });
      if (i === 0 && title && titleMat && titleMesh) {
        const mat = titleMat;
        const mesh = titleMesh;
        jobs.push(
          (async () => {
            const tex = await loadTex(title.src);
            const img = tex.image as HTMLImageElement;
            titleAspect = img.width / img.height;
            mat.uniforms.uMap.value = tex;
            mat.uniforms.uTexel.value.set(1 / img.width, 1 / img.height);
            mesh.visible = true;
            titleBack.visible = true;
            renderer.initTexture(tex);
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
    render(t) {
      timeU.value = t;
      eased.lerp(target, 0.055);
      mouseU.value.copy(eased);
      applyScroll();
      entries[activeIndex].forEach((en) => {
        if (en.baseDrift) en.mat.uniforms.uDrift.value.x = (t * en.baseDrift) % 1;
      });
      renderer.render(scene, camera);

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
