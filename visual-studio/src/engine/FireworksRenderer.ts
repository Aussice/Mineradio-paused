import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { AudioBands } from './AudioEngine';

export type FireworksSettings = { intensity: number; sensitivity: number; bloom: number; gravity: number; wind: number; smoke: boolean; finale: boolean; sound: boolean; palette: number; scene: number };
export const initialSettings: FireworksSettings = { intensity: 65, sensitivity: 65, bloom: 70, gravity: 50, wind: 20, smoke: true, finale: true, sound: false, palette: 0, scene: 0 };
type Particle = { x: number; y: number; z: number; vx: number; vy: number; vz: number; age: number; life: number; size: number; color: THREE.Color; history: number[]; split: boolean; flicker: number };
const palettes = [['#ffb958', '#ffe9ad', '#e88434'], ['#ffa7b8', '#ffd1de', '#d47b91'], ['#8ce1b0', '#c1e8d2', '#72b9b1'], ['#8fb7f1', '#d6e5ff', '#7999df']];
const vertex = `attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
varying vec3 vColor; varying float vAlpha; uniform float uRatio;
void main(){ vColor=aColor; vAlpha=aAlpha; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize=aSize*uRatio; }`;
const fragment = `varying vec3 vColor; varying float vAlpha;
void main(){float d=length(gl_PointCoord-.5)*2.; if(d>1.)discard; float core=exp(-d*d*11.); float glow=exp(-d*d*3.)*.16; gl_FragColor=vec4(vColor*(core+glow),vAlpha);}`;

export class FireworksRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 100);
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private geometry = new THREE.BufferGeometry();
  private material: THREE.ShaderMaterial;
  private bg: THREE.ShaderMaterial;
  private particles: Particle[] = [];
  private capacity = 65000;
  private positions = new Float32Array(this.capacity * 3);
  private colors = new Float32Array(this.capacity * 3);
  private sizes = new Float32Array(this.capacity);
  private alphas = new Float32Array(this.capacity);
  private smoke: { x: number; y: number; age: number; color: THREE.Color; scale: number }[] = [];
  private smokeGeometry = new THREE.BufferGeometry();
  private smokePositions = new Float32Array(80 * 3);
  private smokeSizes = new Float32Array(80);
  private smokeAlphas = new Float32Array(80);
  private smokeColors = new Float32Array(80 * 3);
  private smokeMaterial: THREE.ShaderMaterial;
  private lastLaunch = -1;
  private lastHalo = 0;
  private lastMeteor = 0;
  private lastFinale = -8;
  private bassAverage = 0.2;
  private previousBass = 0;
  private time = 0;
  private width = 1;
  private height = 1;
  private worldW = 16;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  settings = { ...initialSettings };
  count = 0;
  rightInset = 0;
  onBoom?: (distance: number, strength: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.camera.position.z = 20;
    this.bg = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uAspect: { value: 1 }, uFlash: { value: 0 }, uScene: { value: 0 } },
      depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy, .999, 1.);}`,
      fragmentShader: `varying vec2 vUv; uniform float uTime,uAspect,uFlash,uScene;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      float ridge(float x){return sin(x*4.2)*.023+sin(x*11.+1.)*.014+sin(x*25.)*.007+sin(x*47.+4.)*.003;}
      void main(){vec2 uv=vUv;float horizon=.265; vec3 col=mix(vec3(.027,.033,.043),vec3(.009,.014,.024),smoothstep(.2,.85,uv.y));
      float haze=exp(-abs(uv.y-.30)*8.)*(.6+.4*noise(vec2(uv.x*5.+uTime*.006,uv.y*9.)));
      col+=vec3(.037,.027,.019)*haze; col+=vec3(.014,.009,.004)*exp(-length((uv-vec2(.45,.46))*vec2(1.,1.7))*4.);
      float farMountain=.296+ridge(uv.x+1.7);float nearMountain=.273+ridge(uv.x*1.6);
      if(uv.y<farMountain) col=vec3(.021,.025,.029);if(uv.y<nearMountain) col=vec3(.011,.016,.021);
      if(uv.y<horizon){float depth=(horizon-uv.y)/horizon;float ripple=sin(uv.y*920.+noise(vec2(uv.x*90.,uv.y*160.))*7.+uTime*.6);
      col=mix(vec3(.016,.023,.029),vec3(.008,.013,.021),depth);col+=vec3(.008,.006,.003)*ripple*(1.-depth);
      col+=vec3(.037,.028,.018)*pow(max(0.,1.-abs(uv.x-.49)*3.),8.)*(1.-depth)*(.5+.5*ripple);}
      if(uScene>.5 && uScene<1.5){col+=vec3(.005,.009,.019);}
      if(uScene>1.5){col+=vec3(.008,.015,.012)*noise(vec2(uv.x*3.+uTime*.03,uv.y*4.));}
      col+=vec3(.035,.025,.015)*uFlash*exp(-length(uv-vec2(.45,.45))*3.);col*=1.-.28*length((uv-.5)*1.2); gl_FragColor=vec4(col,1.);}`,
    });
    const background = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bg); background.frustumCulled = false; background.renderOrder = -2; this.scene.add(background);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1).setUsage(THREE.DynamicDrawUsage));
    this.material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms: { uRatio: { value: this.renderer.getPixelRatio() } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
    const points = new THREE.Points(this.geometry, this.material); points.frustumCulled = false; this.scene.add(points);
    this.smokeGeometry.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));
    this.smokeGeometry.setAttribute('aColor', new THREE.BufferAttribute(this.smokeColors, 3));
    this.smokeGeometry.setAttribute('aSize', new THREE.BufferAttribute(this.smokeSizes, 1));
    this.smokeGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.smokeAlphas, 1));
    this.smokeMaterial = new THREE.ShaderMaterial({ vertexShader: vertex, uniforms: { uRatio: { value: this.renderer.getPixelRatio() } }, fragmentShader: `varying vec3 vColor; varying float vAlpha; void main(){float d=length(gl_PointCoord-.5)*2.; if(d>1.)discard; float f=exp(-d*d*4.)*smoothstep(1.,.2,d); gl_FragColor=vec4(vColor,f*vAlpha);}`, transparent: true, depthWrite: false, depthTest: false, blending: THREE.NormalBlending });
    const clouds = new THREE.Points(this.smokeGeometry, this.smokeMaterial); clouds.frustumCulled = false; clouds.renderOrder = -1; this.scene.add(clouds);
    this.composer = new EffectComposer(this.renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.7, 0.5);
    this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());
  }

  resize(width: number, height: number) {
    this.width = width; this.height = height; this.worldW = width / height * 10;
    this.camera.left = -this.worldW / 2; this.camera.right = this.worldW / 2; this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false); this.composer.setSize(width, height); this.bg.uniforms.uAspect.value = width / height;
  }

  private coordinates(x: number, y: number) { return [(x - 0.5) * this.worldW, (0.5 - y) * 10]; }

  burst(x?: number, y?: number, kind: 'burst' | 'halo' | 'meteor' = 'burst', force = 1, age = 0) {
    if (this.particles.length > 6400) return;
    const stage = this.width > 850 ? (this.width - this.rightInset) / this.width : 1;
    const [px, py] = this.coordinates(x ?? stage * (0.25 + Math.random() * 0.61), y ?? 0.23 + Math.random() * 0.29);
    // A new shell transfers a short outward impulse to nearby existing embers.
    for (const ember of this.particles) {
      const dx = ember.x - px, dy = ember.y - py;
      const distance = Math.hypot(dx, dy);
      if (distance > .04 && distance < 2.4) {
        const impulse = (1 - distance / 2.4) * .22 * force;
        ember.vx += dx / distance * impulse; ember.vy += dy / distance * impulse;
      }
    }
    const palette = palettes[this.settings.palette];
    const color = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
    const total = Math.round((kind === 'burst' ? 330 : kind === 'halo' ? 190 : 65) * (0.5 + this.settings.intensity / 100) * (this.reduced ? 0.4 : 1));
    const scale = kind === 'halo' ? 1.1 : (0.95 + Math.random() * 0.6) * force;
    for (let i = 0; i < total; i++) {
      const angle = i / total * Math.PI * 2 + Math.random() * 0.015;
      const z = kind === 'halo' ? Math.sin(angle) * 0.15 : Math.random() * 2 - 1;
      const radial = Math.sqrt(1 - z * z);
      const speed = kind === 'meteor' ? 1 + Math.random() * 2 : (1.1 + Math.pow(Math.random(), 0.25) * 1.75) * scale;
      const vx = kind === 'meteor' ? -speed * 1.6 : Math.cos(angle) * radial * speed;
      const vy = kind === 'meteor' ? -speed * 0.7 : Math.sin(angle) * radial * speed;
      const c = color.clone().lerp(new THREE.Color('#fff2c8'), Math.random() * 0.32);
      const p: Particle = { x: px, y: py, z: z * 0.1, vx, vy, vz: z * speed, age: 0, life: kind === 'meteor' ? 1.3 + Math.random() : 2 + Math.random() * 2.2, size: 1.1 + Math.random() * 1.2, color: c, history: [], split: kind === 'burst' && i % 19 === 0, flicker: Math.random() * 100 };
      if (age) { const drag = Math.exp(-age * 0.52); p.x += vx * (1 - drag) / 0.52; p.y += vy * (1 - drag) / 0.52 - age * age * 0.19; p.vx *= drag; p.vy = vy * drag - age * 0.38; p.age = age; for (let j = 0; j < 7; j++) p.history.push(p.x - p.vx * j * .025, p.y - p.vy * j * .025, p.z); }
      this.particles.push(p);
    }
    this.smoke.push({ x: px, y: py, age: 0, color: color.clone().multiplyScalar(0.12), scale: kind === 'burst' ? 1 : 0.6 });
    if (this.smoke.length > 80) this.smoke.shift();
    this.count++;
    if (this.settings.sound) this.onBoom?.(Math.hypot(px * 25, (py + 2.35) * 25, 160), force);
  }

  seed() {
    const stage = this.width > 850 ? (this.width - this.rightInset) / this.width : 1;
    this.burst(stage * 0.58, 0.37, 'burst', 1.35, 0.85);
    this.burst(stage * 0.80, 0.47, 'burst', 0.75, 0.65);
    this.burst(stage * 0.32, 0.50, 'halo', 0.65, 1.1);
  }

  finale() { for (let i = 0; i < 6; i++) this.burst(undefined, .23 + Math.random() * .27, i % 3 === 0 ? 'halo' : 'burst', 1.2); this.lastFinale = this.time; }

  update(dt: number, bands: AudioBands, active: boolean, ambient: boolean) {
    dt = Math.min(dt, 0.035); this.time += dt;
    const t = this.time;
    this.bassAverage += (bands.bass - this.bassAverage) * dt * 1.8;
    const threshold = 1.72 - this.settings.sensitivity / 150;
    if (active && bands.bass > Math.max(0.16, this.bassAverage * threshold) && bands.bass > this.previousBass + 0.015 && t - this.lastLaunch > .38) {
      this.burst(undefined, undefined, 'burst', 0.9 + bands.bass * .65); this.lastLaunch = t;
    }
    if (active && bands.mid > .18 && t - this.lastHalo > 1.65) { this.burst(undefined, undefined, 'halo'); this.lastHalo = t; }
    if (active && bands.high > .085 && t - this.lastMeteor > .9) { this.burst(undefined, .18 + Math.random() * .25, 'meteor'); this.lastMeteor = t; }
    if (active && this.settings.finale && bands.energy > .5 && t - this.lastFinale > 12) this.finale();
    if (ambient && !this.reduced && t - this.lastLaunch > 2.1) { this.burst(undefined, undefined, Math.random() > .76 ? 'halo' : 'burst'); this.lastLaunch = t; }
    this.previousBass = bands.bass;
    const horizon = -2.35;
    let cursor = 0;
    const add = (x: number, y: number, z: number, color: THREE.Color, size: number, alpha: number) => {
      if (cursor >= this.capacity) return;
      const i = cursor * 3; this.positions[i] = x; this.positions[i + 1] = y; this.positions[i + 2] = z;
      this.colors[i] = color.r * 2.3; this.colors[i + 1] = color.g * 2.3; this.colors[i + 2] = color.b * 2.3;
      this.sizes[cursor] = size; this.alphas[cursor] = alpha; cursor++;
    };
    const splits: Particle[] = [];
    this.particles = this.particles.filter(p => {
      p.age += dt; if (p.age > p.life || p.y < -4) return false;
      p.history.unshift(p.x, p.y, p.z); if (p.history.length > 24) p.history.length = 24;
      const drag = Math.exp(-dt * .5);
      p.vx = p.vx * drag + (this.settings.wind - 20) * .0015 * dt + Math.sin(t * .6 + p.y) * .018 * dt;
      p.vy = p.vy * drag - (.18 + this.settings.gravity * .005) * dt; p.vz *= drag;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const remaining = Math.max(0, 1 - p.age / p.life);
      const flicker = p.age > p.life * .65 ? .55 + .45 * Math.sin(p.flicker + t * 28) : 1;
      const alpha = Math.pow(remaining, .7) * flicker;
      const cooling = p.color.clone(); cooling.g *= .6 + remaining * .4; cooling.b *= .3 + remaining * .7;
      add(p.x, p.y, p.z, cooling, p.size * 3, alpha);
      for (let j = 0; j < p.history.length; j += 3) add(p.history[j], p.history[j + 1], p.history[j + 2], cooling, Math.max(1, p.size * (1.6 - j / 25)), alpha * (1 - j / 27) * .42);
      const reflectedY = horizon - (p.y - horizon) * .42;
      const ripple = Math.sin(reflectedY * 160 + t * 2.5) * .04;
      if (p.y > horizon) add(p.x + ripple, reflectedY, -1, cooling, p.size * 4, alpha * .18 * (.5 + .5 * Math.sin(p.x * 80 + t)));
      if (p.split && p.age > p.life * .57 && this.particles.length < 6000) {
        p.split = false;
        for (let j = 0; j < 4; j++) { const angle = Math.random() * Math.PI * 2; splits.push({ ...p, vx: p.vx + Math.cos(angle) * .45, vy: p.vy + Math.sin(angle) * .45, age: 0, life: .5 + Math.random() * .7, size: .65, history: [], split: false }); }
      }
      return true;
    });
    this.particles.push(...splits);
    // Distant stars are rendered in the same lightweight point pass.
    for (let i = 0; i < 145; i++) {
      const a = Math.sin(i * 127.1) * 43758.54, b = Math.sin(i * 311.7) * 96431.3;
      const x = (a - Math.floor(a) - .5) * this.worldW, y = (b - Math.floor(b)) * 7 - 2;
      add(x, y, -3, new THREE.Color('#818790'), i % 9 === 0 ? 2 : 1, .12 + .1 * Math.sin(t * .4 + i));
    }
    this.geometry.setDrawRange(0, cursor);
    for (const key of ['position', 'aColor', 'aSize', 'aAlpha']) this.geometry.attributes[key].needsUpdate = true;
    this.smoke = this.smoke.filter(s => s.age < 7);
    this.smoke.forEach((s, i) => { s.age += dt; s.x += .025 * dt; s.y += .045 * dt; this.smokePositions.set([s.x, s.y, -2], i * 3); this.smokeSizes[i] = (80 + s.age * 26) * s.scale * this.height / 800; this.smokeAlphas[i] = this.settings.smoke ? Math.sin(s.age / 7 * Math.PI) * .22 : 0; this.smokeColors.set([s.color.r, s.color.g, s.color.b], i * 3); });
    this.smokeGeometry.setDrawRange(0, this.smoke.length); for (const key of ['position', 'aColor', 'aSize', 'aAlpha']) this.smokeGeometry.attributes[key].needsUpdate = true;
    this.bloom.strength = this.settings.bloom / 100 * 1.05; this.bg.uniforms.uTime.value = t; this.bg.uniforms.uScene.value = this.settings.scene;
    this.bg.uniforms.uFlash.value = Math.min(1, this.particles.length / 3500);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, 1.12 - Math.min(.2, this.particles.length / 18000), dt * 2);
    this.composer.render();
  }

  capture() { return this.renderer.domElement.toDataURL('image/png'); }
  dispose() {
    this.scene.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Points) o.geometry.dispose(); });
    this.material.dispose(); this.smokeMaterial.dispose(); this.bg.dispose(); this.composer.passes.forEach(pass => pass.dispose()); this.composer.dispose(); this.renderer.dispose();
  }
}
