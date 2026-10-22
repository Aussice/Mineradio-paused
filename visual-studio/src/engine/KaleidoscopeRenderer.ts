import * as THREE from 'three';
import fragmentShader from '../shaders/kaleidoscopeFragment.glsl?raw';
import vertexShader from '../shaders/kaleidoscopeVertex.glsl?raw';
import type { KaleidoscopeState, MaterialObjectType, PetalMode } from '../store/kaleidoscopeStore';

type KaleidoscopeRendererOptions = {
  preserveDrawingBuffer?: boolean;
  renderScale?: number;
};

export class KaleidoscopeRenderer {
  private readonly host: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly material: THREE.ShaderMaterial;
  private readonly textures: THREE.Texture[] = [];
  private readonly placeholderTexture: THREE.Texture;
  private userTexture: THREE.Texture | null = null;
  private userTextureUrl: string | null = null;
  private readonly resizeObserver: ResizeObserver;
  private settings: KaleidoscopeState;
  private frameId = 0;
  private startTime = performance.now();
  private introStartTime = performance.now();
  private introReplayKey: number;
  private audioResponse = { bass: 0, mid: 0, high: 0 };
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly renderScaleOverride?: number;

  constructor(host: HTMLElement, settings: KaleidoscopeState, options: KaleidoscopeRendererOptions = {}) {
    this.host = host;
    this.settings = settings;
    this.introReplayKey = settings.introReplayKey;
    this.renderScaleOverride = options.renderScale;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x05060a, 1);
    this.host.appendChild(this.renderer.domElement);

    const materialTextures = this.createMaterialTextures();
    this.placeholderTexture = this.createPlaceholderTexture();

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uSegments: { value: settings.segments },
        uRotation: { value: settings.rotation },
        uZoom: { value: settings.zoom },
        uColorShift: { value: settings.colorShift },
        uBrightness: { value: settings.brightness },
        uContrast: { value: settings.contrast },
        uCenterPull: { value: settings.centerPull },
        uSeed: { value: settings.thumbnailSeed },
        uPetalMode: { value: petalModeToNumber(settings.petalMode) },
        uPalette0: { value: colorToVector(settings.colorPalette.colors[0]) },
        uPalette1: { value: colorToVector(settings.colorPalette.colors[1]) },
        uPalette2: { value: colorToVector(settings.colorPalette.colors[2]) },
        uPalette3: { value: colorToVector(settings.colorPalette.colors[3]) },
        uMaterialA: { value: createMaterialVector(settings, materialGroupA) },
        uMaterialB: { value: createMaterialVector(settings, materialGroupB) },
        uMaterialC: { value: createMaterialVector(settings, materialGroupC) },
        uEffects: { value: createEffectsVector(settings) },
        uEffects2: { value: createEffectsVector2(settings) },
        uEffects3: { value: createEffectsVector3(settings) },
        uEffects4: { value: createEffectsVector4(settings) },
        uTexFlowerColor: { value: materialTextures.flowerColor },
        uTexFlowerAlpha: { value: materialTextures.flowerAlpha },
        uTexLeafColor: { value: materialTextures.leafColor },
        uTexLeafAlpha: { value: materialTextures.leafAlpha },
        uTexIceColor: { value: materialTextures.iceColor },
        uTexCrystalColor: { value: materialTextures.crystalColor },
        uTexStoneColor: { value: materialTextures.stoneColor },
        uTexPaperColor: { value: materialTextures.paperColor },
        uTexMetalColor: { value: materialTextures.metalColor },
        uTexDust: { value: materialTextures.dustColor },
        uUserImage: { value: this.placeholderTexture },
        uUserImageEnabled: { value: 0 },
        uUserImageParams: { value: createUserImageParams(settings) },
        uUserImageAspect: { value: 1 },
        uIntroProgress: { value: 0 },
        uIntroTime: { value: 0 },
        uIntroLayers: { value: new THREE.Vector4(0, 0, 0, 0) },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  setSettings(settings: KaleidoscopeState) {
    if (settings.introReplayKey !== this.introReplayKey) {
      this.introReplayKey = settings.introReplayKey;
      this.introStartTime = performance.now();
    }

    this.settings = settings;
    this.material.uniforms.uSegments.value = settings.segments;
    this.material.uniforms.uRotation.value = settings.rotation;
    this.material.uniforms.uZoom.value = settings.zoom;
    this.material.uniforms.uColorShift.value = settings.colorShift;
    this.material.uniforms.uBrightness.value = settings.brightness;
    this.material.uniforms.uContrast.value = settings.contrast;
    this.material.uniforms.uCenterPull.value = settings.centerPull;
    this.material.uniforms.uSeed.value = settings.thumbnailSeed;
    this.material.uniforms.uPetalMode.value = petalModeToNumber(settings.petalMode);
    this.material.uniforms.uPalette0.value.copy(colorToVector(settings.colorPalette.colors[0]));
    this.material.uniforms.uPalette1.value.copy(colorToVector(settings.colorPalette.colors[1]));
    this.material.uniforms.uPalette2.value.copy(colorToVector(settings.colorPalette.colors[2]));
    this.material.uniforms.uPalette3.value.copy(colorToVector(settings.colorPalette.colors[3]));
    this.material.uniforms.uMaterialA.value.copy(createMaterialVector(settings, materialGroupA));
    this.material.uniforms.uMaterialB.value.copy(createMaterialVector(settings, materialGroupB));
    this.material.uniforms.uMaterialC.value.copy(createMaterialVector(settings, materialGroupC));
    this.material.uniforms.uEffects.value.copy(createEffectsVector(settings));
    this.material.uniforms.uEffects2.value.copy(createEffectsVector2(settings));
    this.material.uniforms.uEffects3.value.copy(createEffectsVector3(settings));
    this.material.uniforms.uEffects4.value.copy(createEffectsVector4(settings));
    this.material.uniforms.uUserImageParams.value.copy(createUserImageParams(settings));
    this.updateUserTexture(settings.uploadedImage?.url ?? null);
    this.resize();
  }

  setAudioResponse(bass: number, mid: number, high: number) {
    this.audioResponse = { bass, mid, high };
  }

  start() {
    this.startTime = performance.now();
    this.introStartTime = this.startTime;
    this.render();
  }

  captureFrame(timeSeconds = 4.8) {
    this.material.uniforms.uTime.value = timeSeconds * this.settings.speed;
    this.material.uniforms.uIntroProgress.value = 1;
    this.material.uniforms.uIntroTime.value = introTiming.duration;
    this.material.uniforms.uIntroLayers.value.set(1, 1, 1, 1);
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/jpeg', 0.88);
  }

  dispose() {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
      }
    });
    this.material.dispose();
    this.userTexture?.dispose();
    this.textures.forEach((texture) => texture.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private createMaterialTextures() {
    return {
      flowerColor: this.loadTexture(textureUrls.flowerColor, true),
      flowerAlpha: this.loadTexture(textureUrls.flowerAlpha, false),
      leafColor: this.loadTexture(textureUrls.leafColor, true),
      leafAlpha: this.loadTexture(textureUrls.leafAlpha, false),
      iceColor: this.loadTexture(textureUrls.iceColor, true),
      crystalColor: this.loadTexture(textureUrls.crystalColor, true),
      stoneColor: this.loadTexture(textureUrls.stoneColor, true),
      paperColor: this.loadTexture(textureUrls.paperColor, true),
      metalColor: this.loadTexture(textureUrls.metalColor, true),
      dustColor: this.loadTexture(textureUrls.dustColor, false),
    };
  }

  private createPlaceholderTexture() {
    const data = new Uint8Array([10, 14, 24, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    this.textures.push(texture);
    return texture;
  }

  private loadTexture(url: string, useSrgb: boolean) {
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = useSrgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.textures.push(texture);
    return texture;
  }

  private updateUserTexture(url: string | null) {
    if (url === this.userTextureUrl) {
      return;
    }

    this.userTextureUrl = url;
    this.userTexture?.dispose();
    this.userTexture = null;
    this.material.uniforms.uUserImageEnabled.value = url ? 1 : 0;

    if (!url) {
      this.material.uniforms.uUserImage.value = this.placeholderTexture;
      this.material.uniforms.uUserImageAspect.value = 1;
      return;
    }

    const texture = new THREE.TextureLoader().load(url, (loadedTexture) => {
      const image = loadedTexture.image as HTMLImageElement | ImageBitmap | undefined;
      const width = image && 'width' in image ? image.width : 1;
      const height = image && 'height' in image ? image.height : 1;
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.wrapS = THREE.RepeatWrapping;
      loadedTexture.wrapT = THREE.RepeatWrapping;
      loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
      loadedTexture.magFilter = THREE.LinearFilter;
      loadedTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      loadedTexture.needsUpdate = true;
      this.material.uniforms.uUserImageAspect.value = width / Math.max(1, height);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.userTexture = texture;
    this.material.uniforms.uUserImage.value = texture;
  }

  private resize() {
    const { width, height } = this.host.getBoundingClientRect();
    const renderScale = this.renderScaleOverride ?? (isUploadedImageMode(this.settings) ? 1 : 0.72);
    const nextWidth = Math.max(1, Math.floor(width * renderScale));
    const nextHeight = Math.max(1, Math.floor(height * renderScale));

    this.renderer.setSize(nextWidth, nextHeight, false);
    this.material.uniforms.uResolution.value.set(nextWidth, nextHeight);
  }

  private render = () => {
    this.frameId = requestAnimationFrame(this.render);
    const now = performance.now();
    const introElapsed = this.reducedMotion ? introTiming.duration : (now - this.introStartTime) / 1000;
    const introState = createIntroState(introElapsed);
    this.material.uniforms.uTime.value = this.reducedMotion ? 4.8 : ((now - this.startTime) / 1000) * this.settings.speed;
    this.material.uniforms.uZoom.value = this.settings.zoom * (1 + (this.reducedMotion ? 0 : this.audioResponse.bass) * 0.065);
    this.material.uniforms.uBrightness.value = this.settings.brightness * (1 + (this.reducedMotion ? 0 : this.audioResponse.mid) * 0.17);
    this.material.uniforms.uColorShift.value = this.settings.colorShift + (this.reducedMotion ? 0 : this.audioResponse.high) * 0.055;
    this.material.uniforms.uIntroProgress.value = introState.progress;
    this.material.uniforms.uIntroTime.value = introElapsed;
    this.material.uniforms.uIntroLayers.value.copy(introState.layers);
    this.renderer.render(this.scene, this.camera);
  };
}

const introTiming = {
  duration: 3,
  centerStart: 0,
  centerEnd: 1.25,
  middleStart: 0.82,
  middleEnd: 2.12,
  outerStart: 1.35,
  outerEnd: 2.72,
} as const;

function createIntroState(elapsed: number) {
  const progress = easeOutCubic(clamp01(elapsed / introTiming.duration));

  return {
    progress,
    layers: new THREE.Vector4(
      easeOutCubic(normalizeTime(elapsed, introTiming.centerStart, introTiming.centerEnd)),
      easeOutCubic(normalizeTime(elapsed, introTiming.middleStart, introTiming.middleEnd)),
      easeOutCubic(normalizeTime(elapsed, introTiming.outerStart, introTiming.outerEnd)),
      progress,
    ),
  };
}

function normalizeTime(time: number, start: number, end: number) {
  return clamp01((time - start) / (end - start));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

const materialGroupA: MaterialObjectType[] = ['glassBead', 'crystalShard', 'flowerPetal', 'leaf'];
const materialGroupB: MaterialObjectType[] = ['metalPin', 'pearl', 'shell', 'acrylicPiece'];
const materialGroupC: MaterialObjectType[] = ['mineralStone', 'waterBubble', 'paperFiber'];

function colorToVector(hex: string) {
  const color = new THREE.Color(hex);
  return new THREE.Vector3(color.r, color.g, color.b);
}

function createMaterialVector(settings: KaleidoscopeState, group: MaterialObjectType[]) {
  const values = group.map((type) => {
    return settings.materialObjects.find((material) => material.type === type)?.amount ?? 0;
  });
  const density = settings.materialObjects.reduce((sum, material) => sum + material.amount, 0) / 8;

  return new THREE.Vector4(values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? density);
}

function createEffectsVector(settings: KaleidoscopeState) {
  return new THREE.Vector4(
    settings.effects.grain,
    settings.effects.defocus,
    settings.effects.misalignment,
    settings.effects.vignette,
  );
}

function createEffectsVector2(settings: KaleidoscopeState) {
  return new THREE.Vector4(
    settings.effects.dust,
    settings.effects.shadow,
    settings.effects.mirrorImperfection,
    settings.effects.glassRefraction,
  );
}

function createEffectsVector3(settings: KaleidoscopeState) {
  return new THREE.Vector4(
    settings.effects.macroDepthBlur,
    settings.effects.centerSharpness,
    settings.effects.edgeSoftness,
    settings.effects.softSpecular,
  );
}

function createEffectsVector4(settings: KaleidoscopeState) {
  return new THREE.Vector4(
    settings.effects.chromaticAberration,
    settings.effects.lensVignette,
    settings.effects.subtleDust,
    0,
  );
}

function createUserImageParams(settings: KaleidoscopeState) {
  const isImageKaleidoscope =
    settings.uploadedImage && settings.selectedPresetId === uploadedImagePresetId;

  return new THREE.Vector4(
    isImageKaleidoscope ? 1 : 0,
    settings.uploadedImageSettings.strength,
    settings.uploadedImageSettings.scale,
    settings.uploadedImageSettings.coverage,
  );
}

function petalModeToNumber(mode: PetalMode) {
  if (mode === 'six') {
    return 6;
  }

  if (mode === 'seven') {
    return 7;
  }

  return 8;
}

const textureUrls = {
  flowerColor: new URL(
    '../../sucai/ambientcg/flower_petals_FlowerSet001/pbr_1k_jpg/FlowerSet001_1K-JPG_Color.jpg',
    import.meta.url,
  ).href,
  flowerAlpha: new URL(
    '../../sucai/ambientcg/flower_petals_FlowerSet001/pbr_1k_jpg/FlowerSet001_1K-JPG_Opacity.jpg',
    import.meta.url,
  ).href,
  leafColor: new URL(
    '../../sucai/ambientcg/leaf_macro_Leaf001/pbr_1k_jpg/Leaf001_1K-JPG_Color.jpg',
    import.meta.url,
  ).href,
  leafAlpha: new URL(
    '../../sucai/ambientcg/leaf_macro_Leaf001/pbr_1k_jpg/Leaf001_1K-JPG_Opacity.jpg',
    import.meta.url,
  ).href,
  iceColor: new URL(
    '../../sucai/ambientcg/ice_glass_water_Ice003/pbr_1k_jpg/Ice003_1K-JPG_Color.jpg',
    import.meta.url,
  ).href,
  crystalColor: new URL(
    '../../sucai/ambientcg/crystal_onyx_Onyx015/pbr_1k_jpg/Onyx015_1K-JPG_Color.jpg',
    import.meta.url,
  ).href,
  stoneColor: new URL(
    '../../sucai/ambientcg/polished_marble_Marble021/pbr_1k_jpg/Marble021_1K-JPG_Color.jpg',
    import.meta.url,
  ).href,
  paperColor: new URL(
    '../../sucai/ambientcg/old_paper_Paper006/pbr_1k_jpg/Paper006_1K-JPG_Color.jpg',
    import.meta.url,
  ).href,
  metalColor: new URL(
    '../../sucai/ambientcg/clean_metal_Metal049A/pbr_1k_jpg/Metal049A_1K-JPG_Color.jpg',
    import.meta.url,
  ).href,
  dustColor: new URL(
    '../../sucai/ambientcg/dust_smudge_SurfaceImperfections015/pbr_1k_jpg/SurfaceImperfections015_1K-JPG_Color.jpg',
    import.meta.url,
  ).href,
} satisfies Record<string, string>;

const uploadedImagePresetId = 'uploaded-image-kaleidoscope';

function isUploadedImageMode(settings: KaleidoscopeState) {
  return Boolean(settings.uploadedImage && settings.selectedPresetId === uploadedImagePresetId);
}
