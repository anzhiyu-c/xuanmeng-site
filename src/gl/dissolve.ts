// 角色舞台：两张立绘之间的光晕溶解。旧立绘化作一层暖光散去，新立绘从光里显形。
import * as THREE from 'three';

const VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

const FRAG = /* glsl */ `
uniform sampler2D uA, uB;
uniform float uP, uT, uAspA, uAspB, uCanvasAsp;
uniform vec2 uMouse;
uniform vec3 uBurn;
varying vec2 vUv;

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

// 立绘等比居中放进画布（contain）
vec4 sampleFit(sampler2D tex, vec2 uv, float imgAsp, vec2 shift){
  vec2 s = uCanvasAsp > imgAsp ? vec2(uCanvasAsp/imgAsp, 1.) : vec2(1., imgAsp/uCanvasAsp);
  vec2 q = (uv - .5)*s + .5 + shift;
  if(q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) return vec4(0.);
  return texture2D(tex, q);
}

void main(){
  vec2 uv = vUv;
  float n = fbm(uv*vec2(4.,6.) + uT*.03);
  float fine = fbm(uv*28.);
  float field = n*.74 + fine*.26;

  // 轻微的呼吸与鼠标视差
  vec2 breath = vec2(0., sin(uT*.7)*.005);
  vec2 par = uMouse*.012;

  float p = uP*1.36 - .18;

  // 旧图被吹散时向上飘，新图从下方升起并微微放大落定
  vec4 a = sampleFit(uA, uv, uAspA, -par + breath + vec2(0., -uP*.05));
  vec2 zoom = (uv - .5)*(1. + (1. - uP)*.08) + .5;
  vec4 b = sampleFit(uB, zoom, uAspB, -par + breath + vec2(0., (1. - uP)*.04));

  float cutA = smoothstep(p - .05, p + .05, field);     // 1=旧图还在
  float cutB = 1. - smoothstep(p - .2, p - .11, field);  // 1=新图已现

  vec3 rgb = vec3(0.);
  float alpha = 0.;
  if(uP < 1.){
    rgb += a.rgb*a.a*cutA;
    alpha += a.a*cutA;
  }
  float showB = cutB*b.a;
  rgb = mix(rgb, b.rgb*b.a, cutB*step(.001, b.a));
  alpha = max(alpha*(1. - cutB*step(.001, b.a)), showB);

  // 溶解前沿：柔和的暖光，只出现在有画面的地方
  float edgeA = 1. - smoothstep(.0, .12, abs(field - p));
  float edgeB = 1. - smoothstep(.0, .1, abs(field - (p - .155)));
  float running = step(.001, uP)*step(uP, .999);
  vec3 burn = uBurn*(edgeA*a.a*.9 + edgeB*b.a*.7)*running;
  rgb += burn;
  alpha = max(alpha, clamp((edgeA*a.a + edgeB*b.a)*running*.8, 0., 1.));

  gl_FragColor = vec4(rgb, alpha);
}`;

export interface Dissolve {
  /** 切到第 i 张，返回动画结束的 Promise */
  show(i: number, instant?: boolean): Promise<void>;
  preload(i: number): void;
  setMouse(x: number, y: number): void;
  setBurn(color: string): void;
  tick(t: number): void;
  resize(): void;
}

export function createDissolve(canvas: HTMLCanvasElement, sources: string[]): Dissolve | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const cam = new THREE.Camera();
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  blank.needsUpdate = true;

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uA: { value: blank },
      uB: { value: blank },
      uP: { value: 1 },
      uT: { value: 0 },
      uAspA: { value: 1 },
      uAspB: { value: 1 },
      uCanvasAsp: { value: 1 },
      uMouse: { value: new THREE.Vector2() },
      uBurn: { value: new THREE.Color('#ffc766') },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const loader = new THREE.TextureLoader();
  const cache = new Map<number, Promise<THREE.Texture>>();
  const load = (i: number) => {
    if (!cache.has(i)) {
      cache.set(
        i,
        loader.loadAsync(sources[i]).then((tex) => {
          tex.colorSpace = THREE.NoColorSpace;
          tex.anisotropy = 4;
          // 贴图为直通 alpha，着色器里自行预乘
          tex.premultiplyAlpha = false;
          renderer.initTexture(tex);
          return tex;
        }),
      );
    }
    return cache.get(i)!;
  };

  const target = new THREE.Vector2();
  let token = 0;
  let current: THREE.Texture | null = null;

  const aspectOf = (tex: THREE.Texture) => {
    const img = tex.image as HTMLImageElement;
    return img.width / img.height;
  };

  const resize = () => {
    const r = canvas.parentElement!.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    mat.uniforms.uCanvasAsp.value = r.width / Math.max(1, r.height);
  };
  resize();
  window.addEventListener('resize', resize);

  return {
    async show(i, instant) {
      const mine = ++token;
      const tex = await load(i);
      if (mine !== token) return;
      if (instant || !current) {
        // 首张也走一遍显形，只是从空开始
        mat.uniforms.uA.value = current ?? blank;
        mat.uniforms.uAspA.value = current ? aspectOf(current) : 1;
      } else {
        mat.uniforms.uA.value = current;
        mat.uniforms.uAspA.value = aspectOf(current);
      }
      mat.uniforms.uB.value = tex;
      mat.uniforms.uAspB.value = aspectOf(tex);
      current = tex;
      if (instant) {
        mat.uniforms.uP.value = 1;
        return;
      }
      mat.uniforms.uP.value = 0;
      const start = performance.now();
      const duration = 1300;
      await new Promise<void>((done) => {
        const step = () => {
          if (mine !== token) return done();
          const k = Math.min(1, (performance.now() - start) / duration);
          mat.uniforms.uP.value = k * k * (3 - 2 * k);
          if (k < 1) requestAnimationFrame(step);
          else done();
        };
        step();
      });
    },
    preload(i) {
      void load(i);
    },
    setMouse(x, y) {
      target.set(x, y);
    },
    setBurn(color) {
      mat.uniforms.uBurn.value.set(color);
    },
    tick(t) {
      mat.uniforms.uT.value = t;
      mat.uniforms.uMouse.value.lerp(target, 0.07);
      renderer.render(scene, cam);
    },
    resize,
  };
}
