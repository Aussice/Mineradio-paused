import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { artKaleidoscopePresets, type ArtKaleidoscopePreset } from '../presets';

export type PetalMode = 'six' | 'seven' | 'eight';

export type MaterialObjectType =
  | 'glassBead'
  | 'crystalShard'
  | 'flowerPetal'
  | 'leaf'
  | 'metalPin'
  | 'pearl'
  | 'shell'
  | 'acrylicPiece'
  | 'mineralStone'
  | 'waterBubble'
  | 'paperFiber';

export type VisualParameters = {
  segments: number;
  rotation: number;
  zoom: number;
  speed: number;
  colorShift: number;
  brightness: number;
  contrast: number;
  centerPull: number;
};

export type ColorPalette = {
  name: string;
  colors: [string, string, string, string];
};

export type MaterialObjectSpec = {
  type: MaterialObjectType;
  label: string;
  amount: number;
  visualSimulation: string;
};

export type KaleidoscopeEffects = {
  grain: number;
  defocus: number;
  misalignment: number;
  vignette: number;
  dust: number;
  shadow: number;
  macroDepthBlur: number;
  centerSharpness: number;
  lensVignette: number;
  subtleDust: number;
  mirrorImperfection: number;
  glassRefraction: number;
  edgeSoftness: number;
  softSpecular: number;
  chromaticAberration: number;
};

export type KaleidoscopeState = VisualParameters & {
  selectedPresetId: string;
  petalMode: PetalMode;
  colorPalette: ColorPalette;
  materialObjects: MaterialObjectSpec[];
  effects: KaleidoscopeEffects;
  thumbnailSeed: number;
  introReplayKey: number;
  uploadedImage: UploadedImage | null;
  uploadedImageSettings: UploadedImageSettings;
};

export type UploadedImage = {
  url: string;
  name: string;
};

export type UploadedImageSettings = {
  strength: number;
  scale: number;
  coverage: number;
};

export const uploadedImagePresetId = 'uploaded-image-kaleidoscope';

type ParameterLimit = {
  min: number;
  max: number;
  step: number;
};

type KaleidoscopeContextValue = {
  settings: KaleidoscopeState;
  currentPreset: ArtKaleidoscopePreset;
  updateSettings: (settings: Partial<VisualParameters>) => void;
  setUploadedImage: (image: UploadedImage | null) => void;
  updateUploadedImageSettings: (settings: Partial<UploadedImageSettings>) => void;
  activateUploadedImageMode: () => void;
  applyPreset: (presetId: string) => void;
  replayIntroAnimation: () => void;
  resetSettings: () => void;
  randomizeSettings: () => void;
};

export const parameterLimits = {
  segments: { min: 3, max: 32, step: 1 },
  rotation: { min: 0, max: 6.283, step: 0.001 },
  zoom: { min: 0.5, max: 6, step: 0.01 },
  speed: { min: 0, max: 3, step: 0.01 },
  colorShift: { min: 0, max: 1, step: 0.01 },
  brightness: { min: 0.5, max: 2, step: 0.01 },
  contrast: { min: 0.5, max: 2.5, step: 0.01 },
  centerPull: { min: -1, max: 1, step: 0.01 },
} satisfies Record<keyof VisualParameters, ParameterLimit>;

export const defaultKaleidoscopeState = createStateFromPreset(artKaleidoscopePresets[0]);

const KaleidoscopeContext = createContext<KaleidoscopeContextValue | null>(null);

export function KaleidoscopeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<KaleidoscopeState>(defaultKaleidoscopeState);
  const currentPreset = getCurrentPreset(settings);

  const value = useMemo<KaleidoscopeContextValue>(
    () => ({
      settings,
      currentPreset,
      updateSettings: (nextSettings) => {
        setSettings((current) => ({
          ...current,
          ...normalizeSettings(nextSettings),
        }));
      },
      setUploadedImage: (image) => {
        setSettings((current) => {
          if (!image) {
            return {
              ...current,
              uploadedImage: null,
            };
          }

          return createStateFromUploadedImage(current, image);
        });
      },
      updateUploadedImageSettings: (nextSettings) => {
        setSettings((current) => ({
          ...current,
          uploadedImageSettings: {
            ...current.uploadedImageSettings,
            ...nextSettings,
          },
        }));
      },
      activateUploadedImageMode: () => {
        setSettings((current) => {
          if (!current.uploadedImage) {
            return current;
          }

          return createStateFromUploadedImage(current, current.uploadedImage, {
            preserveUploadSettings: true,
          });
        });
      },
      applyPreset: (presetId) => {
        const preset =
          artKaleidoscopePresets.find((candidate) => candidate.id === presetId) ??
          artKaleidoscopePresets[0];
        setSettings((current) => ({
          ...createStateFromPreset(preset),
          introReplayKey: current.introReplayKey + 1,
          uploadedImage: current.uploadedImage,
          uploadedImageSettings: current.uploadedImageSettings,
        }));
      },
      replayIntroAnimation: () => {
        setSettings((current) => ({
          ...current,
          introReplayKey: current.introReplayKey + 1,
        }));
      },
      resetSettings: () => {
        setSettings((current) => ({
          ...createStateFromPreset(currentPreset),
          introReplayKey: current.introReplayKey + 1,
          uploadedImage: current.uploadedImage,
          uploadedImageSettings: current.uploadedImageSettings,
        }));
      },
      randomizeSettings: () => {
        setSettings((current) => ({
          ...current,
          ...createRandomParameters(),
          thumbnailSeed: randomFloat(1, 999),
        }));
      },
    }),
    [currentPreset, settings],
  );

  return <KaleidoscopeContext.Provider value={value}>{children}</KaleidoscopeContext.Provider>;
}

export function useKaleidoscope() {
  const context = useContext(KaleidoscopeContext);

  if (!context) {
    throw new Error('useKaleidoscope must be used inside KaleidoscopeProvider');
  }

  return context;
}

export function createStateFromPreset(preset: ArtKaleidoscopePreset): KaleidoscopeState {
  return {
    selectedPresetId: preset.id,
    petalMode: preset.petalMode,
    colorPalette: preset.colorPalette,
    materialObjects: preset.materialObjects,
    effects: preset.effects,
    thumbnailSeed: preset.thumbnailSeed,
    introReplayKey: 0,
    uploadedImage: null,
    uploadedImageSettings: {
      strength: 0.72,
      scale: 1,
      coverage: 0.68,
    },
    ...preset.defaultParams,
  };
}

function createStateFromUploadedImage(
  current: KaleidoscopeState,
  image: UploadedImage,
  options: { preserveUploadSettings?: boolean } = {},
): KaleidoscopeState {
  return {
    ...current,
    selectedPresetId: uploadedImagePresetId,
    introReplayKey: current.introReplayKey + 1,
    petalMode: 'eight',
    segments: 8,
    rotation: 0,
    zoom: 1.08,
    speed: 0.34,
    colorShift: 0,
    brightness: 1.04,
    contrast: 1.14,
    centerPull: 0.12,
    colorPalette: {
      name: '上传图片',
      colors: ['#090b12', '#1f2a44', '#d8dde8', '#f2c85b'],
    },
    materialObjects: [
      {
        type: 'acrylicPiece',
        label: '照片胶片碎片',
        amount: 1,
        visualSimulation: '以上传图片为主纹理的半透明胶片碎片',
      },
      {
        type: 'glassBead',
        label: '照片玻璃珠',
        amount: 0.82,
        visualSimulation: '球面高光和照片折射',
      },
      {
        type: 'crystalShard',
        label: '照片水晶片',
        amount: 0.72,
        visualSimulation: '照片切片、水晶亮边和透明叠层',
      },
      {
        type: 'paperFiber',
        label: '照片纤维边',
        amount: 0.34,
        visualSimulation: '柔边、颗粒和轻微纸面纹理',
      },
    ],
    effects: {
      ...current.effects,
      grain: 0.24,
      defocus: 0.32,
      misalignment: 0.26,
      vignette: 0.74,
      dust: 0.2,
      shadow: 0.36,
      macroDepthBlur: 0.34,
      centerSharpness: 0.84,
      lensVignette: 0.74,
      subtleDust: 0.2,
      mirrorImperfection: 0.26,
      glassRefraction: 0.3,
      edgeSoftness: 0.36,
      softSpecular: 0.52,
      chromaticAberration: 0.1,
    },
    thumbnailSeed: randomFloat(1, 999),
    uploadedImage: image,
    uploadedImageSettings: options.preserveUploadSettings
      ? current.uploadedImageSettings
      : {
          strength: 1,
          scale: 0.78,
          coverage: 1,
        },
  };
}

function getCurrentPreset(settings: KaleidoscopeState): ArtKaleidoscopePreset {
  if (settings.selectedPresetId === uploadedImagePresetId && settings.uploadedImage) {
    return {
      id: uploadedImagePresetId,
      title: '影像花镜',
      subtitle: `以「${settings.uploadedImage.name}」生成的新万花筒`,
      inspirationType: 'memory',
      inspirationName: '上传图片',
      petalMode: settings.petalMode,
      description: '上传图片被切成照片胶片、玻璃珠和水晶碎片，再进入镜面折叠与微距镜筒后处理。',
      backgroundStory:
        '这不是预设里混入一张图，而是以用户上传的图片作为主材料生成的全新万花筒。',
      colorPalette: settings.colorPalette,
      materialObjects: settings.materialObjects,
      visualMood: ['crystalline', 'archival'],
      defaultParams: {
        segments: settings.segments,
        rotation: settings.rotation,
        zoom: settings.zoom,
        speed: settings.speed,
        colorShift: settings.colorShift,
        brightness: settings.brightness,
        contrast: settings.contrast,
        centerPull: settings.centerPull,
      },
      effects: settings.effects,
      thumbnailSeed: settings.thumbnailSeed,
    };
  }

  return (
    artKaleidoscopePresets.find((preset) => preset.id === settings.selectedPresetId) ??
    artKaleidoscopePresets[0]
  );
}

function normalizeSettings(settings: Partial<VisualParameters>) {
  const normalized = { ...settings };

  if (typeof normalized.segments === 'number') {
    normalized.segments = Math.round(normalized.segments);
  }

  return normalized;
}

function createRandomParameters(): VisualParameters {
  return {
    segments: randomInteger(parameterLimits.segments.min, parameterLimits.segments.max),
    rotation: randomFloat(parameterLimits.rotation.min, parameterLimits.rotation.max),
    zoom: randomFloat(0.75, parameterLimits.zoom.max),
    speed: randomFloat(0.25, parameterLimits.speed.max),
    colorShift: randomFloat(parameterLimits.colorShift.min, parameterLimits.colorShift.max),
    brightness: randomFloat(0.74, 1.36),
    contrast: randomFloat(0.88, parameterLimits.contrast.max),
    centerPull: randomFloat(parameterLimits.centerPull.min, parameterLimits.centerPull.max),
  };
}

function randomFloat(min: number, max: number) {
  return Number((min + Math.random() * (max - min)).toFixed(3));
}

function randomInteger(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}
