import type {
  ColorPalette,
  KaleidoscopeEffects,
  MaterialObjectSpec,
  MaterialObjectType,
  PetalMode,
  VisualParameters,
} from '../store/kaleidoscopeStore';

export type InspirationType =
  | 'painting'
  | 'flower'
  | 'seascape'
  | 'garden'
  | 'city'
  | 'landscape'
  | 'memory';

export type VisualMood = 'crystalline' | 'botanical' | 'oceanic' | 'nocturne' | 'warm' | 'archival';

export type ArtKaleidoscopePreset = {
  id: string;
  title: string;
  subtitle: string;
  inspirationType: InspirationType;
  inspirationName: string;
  petalMode: PetalMode;
  description: string;
  backgroundStory: string;
  colorPalette: ColorPalette;
  materialObjects: MaterialObjectSpec[];
  visualMood: VisualMood[];
  defaultParams: VisualParameters;
  effects: KaleidoscopeEffects;
  thumbnailSeed: number;
};

export const artKaleidoscopePresets: ArtKaleidoscopePreset[] = [
  {
    id: 'starry-night-glass-garden',
    title: '星璃夜庭',
    subtitle: '八瓣镜筒里的蓝夜、玻璃珠与金色碎星',
    inspirationType: 'painting',
    inspirationName: '星月夜',
    petalMode: 'eight',
    description: '深蓝玻璃珠、透明水泡、冷色水晶、金属丝和少量花瓣形成中心花形。',
    backgroundStory: '像把夜色花园装进真实万花筒：蓝色玻璃珠是夜空，金属丝像星轨，花瓣在中心聚成月光。',
    colorPalette: palette('钴蓝星光', ['#07112b', '#123f8c', '#18c8c3', '#f4c84a']),
    materialObjects: materials([
      ['glassBead', 1],
      ['waterBubble', 0.82],
      ['crystalShard', 0.78],
      ['metalPin', 0.56],
      ['flowerPetal', 0.42],
      ['pearl', 0.22],
    ]),
    visualMood: ['crystalline', 'nocturne', 'botanical'],
    defaultParams: params(8, 0.18, 1.02, 0.52, 0.12, 1.05, 1.18, 0.2),
    effects: effects(0.22, 0.34, 0.28, 0.76, 0.24, 0.34, {
      macroDepthBlur: 0.36,
      centerSharpness: 0.84,
      lensVignette: 0.78,
      subtleDust: 0.22,
      mirrorImperfection: 0.28,
      glassRefraction: 0.26,
      edgeSoftness: 0.38,
      softSpecular: 0.48,
      chromaticAberration: 0.12,
    }),
    thumbnailSeed: 127.4,
  },
  {
    id: 'blooming-apricot',
    title: '杏花微雪',
    subtitle: '七瓣镜筒中的柔白花瓣与浅金露珠',
    inspirationType: 'flower',
    inspirationName: '杏花',
    petalMode: 'seven',
    description: '半透明花瓣、珍珠、纸纤维和少量水泡构成柔软中心，保留手工拼贴的轻微错位。',
    backgroundStory: '早春杏花被拆成细小花瓣与露珠，进入七面镜筒后形成不完全对称的温柔花轮。',
    colorPalette: palette('杏花晨雾', ['#fff7ef', '#f4c4b4', '#e8a25e', '#8dbbc0']),
    materialObjects: materials([
      ['flowerPetal', 1],
      ['pearl', 0.72],
      ['paperFiber', 0.46],
      ['waterBubble', 0.38],
      ['glassBead', 0.28],
      ['acrylicPiece', 0.18],
    ]),
    visualMood: ['botanical', 'warm'],
    defaultParams: params(7, 0.28, 1.24, 0.42, 0.06, 1.04, 1.02, 0.12),
    effects: effects(0.2, 0.46, 0.34, 0.62, 0.22, 0.3, {
      macroDepthBlur: 0.48,
      centerSharpness: 0.76,
      lensVignette: 0.58,
      mirrorImperfection: 0.34,
      glassRefraction: 0.18,
      edgeSoftness: 0.5,
      softSpecular: 0.34,
      chromaticAberration: 0.06,
    }),
    thumbnailSeed: 214.9,
  },
  {
    id: 'iris-green-crystal',
    title: '鸢尾青晶',
    subtitle: '六瓣绿晶、叶脉与蓝紫花片',
    inspirationType: 'flower',
    inspirationName: '鸢尾花',
    petalMode: 'six',
    description: '叶片、绿晶碎片和蓝紫花瓣形成稳定六瓣结构，湿润高光和叶脉纹理更清晰。',
    backgroundStory: '鸢尾花的绿色叶脉和蓝紫花瓣被切成小片，晶体稳定围绕中心。',
    colorPalette: palette('鸢尾绿晶', ['#061f12', '#159a4c', '#82e675', '#536de8']),
    materialObjects: materials([
      ['leaf', 1],
      ['crystalShard', 0.78],
      ['flowerPetal', 0.56],
      ['glassBead', 0.38],
      ['waterBubble', 0.32],
      ['metalPin', 0.2],
    ]),
    visualMood: ['botanical', 'crystalline'],
    defaultParams: params(6, 0.08, 1.34, 0.48, 0.18, 0.98, 1.14, 0.22),
    effects: effects(0.26, 0.3, 0.22, 0.72, 0.2, 0.38),
    thumbnailSeed: 319.2,
  },
  {
    id: 'ocean-blue-crystal',
    title: '海蓝碎晶',
    subtitle: '八瓣海蓝晶体、贝壳与玻璃水泡',
    inspirationType: 'seascape',
    inspirationName: '海浪',
    petalMode: 'eight',
    description: '蓝绿水晶、贝壳珠光和透明珠子叠在一起，像海水折射到镜筒边缘。',
    backgroundStory: '海浪被拆成贝壳碎片、蓝晶和细小水泡，八瓣结构让画面更像珠宝盒中的海面。',
    colorPalette: palette('海浪蓝晶', ['#062c3a', '#0b8faf', '#66e4d2', '#f3edcf']),
    materialObjects: materials([
      ['crystalShard', 1],
      ['waterBubble', 0.82],
      ['glassBead', 0.74],
      ['shell', 0.64],
      ['pearl', 0.38],
      ['acrylicPiece', 0.24],
    ]),
    visualMood: ['oceanic', 'crystalline'],
    defaultParams: params(8, 0.5, 1.08, 0.56, 0.28, 0.98, 1.18, 0.08),
    effects: effects(0.24, 0.34, 0.26, 0.7, 0.24, 0.36, {
      macroDepthBlur: 0.36,
      centerSharpness: 0.82,
      mirrorImperfection: 0.26,
      glassRefraction: 0.32,
      softSpecular: 0.58,
      chromaticAberration: 0.14,
    }),
    thumbnailSeed: 442.7,
  },
  {
    id: 'water-lily-pond',
    title: '莲池浮光',
    subtitle: '七瓣水面绿叶与珍珠露珠',
    inspirationType: 'garden',
    inspirationName: '睡莲池塘',
    petalMode: 'seven',
    description: '绿色叶片与白色珍珠包围柔和花心，虚焦边缘让画面更像浅景深微距照片。',
    backgroundStory: '睡莲池塘的低语被压进镜筒，叶片轻轻摇晃，珍珠露珠在每次折叠中显出阴影。',
    colorPalette: palette('池塘柔绿', ['#082615', '#2f7e40', '#c7efb0', '#f8fff2']),
    materialObjects: materials([
      ['leaf', 1],
      ['pearl', 0.78],
      ['waterBubble', 0.7],
      ['flowerPetal', 0.44],
      ['glassBead', 0.3],
      ['metalPin', 0.16],
    ]),
    visualMood: ['botanical'],
    defaultParams: params(7, 0.22, 1.18, 0.38, 0.11, 1, 1.02, 0.24),
    effects: effects(0.22, 0.5, 0.3, 0.66, 0.18, 0.36, {
      macroDepthBlur: 0.52,
      centerSharpness: 0.7,
      edgeSoftness: 0.54,
      mirrorImperfection: 0.3,
    }),
    thumbnailSeed: 501.8,
  },
  {
    id: 'night-cafe-terrace',
    title: '夜亭灯雨',
    subtitle: '八瓣深蓝夜幕与琥珀灯光',
    inspirationType: 'painting',
    inspirationName: '夜晚露天咖啡座',
    petalMode: 'eight',
    description: '深蓝玻璃、黄色亚克力片、金属丝与透明珠子营造夜街灯光的真实拼贴感。',
    backgroundStory: '蓝玻璃珠和暖黄色亚克力片像咖啡馆窗灯，金属丝把夜色切成微微弯曲的星线。',
    colorPalette: palette('咖啡馆夜灯', ['#06102c', '#15358d', '#16b9c5', '#efb23d']),
    materialObjects: materials([
      ['glassBead', 0.9],
      ['acrylicPiece', 0.72],
      ['metalPin', 0.68],
      ['waterBubble', 0.42],
      ['crystalShard', 0.36],
      ['pearl', 0.18],
    ]),
    visualMood: ['nocturne', 'warm'],
    defaultParams: params(8, 0.42, 1.3, 0.48, 0.42, 0.98, 1.22, 0.1),
    effects: effects(0.3, 0.3, 0.3, 0.8, 0.3, 0.42, {
      macroDepthBlur: 0.34,
      centerSharpness: 0.82,
      lensVignette: 0.82,
      mirrorImperfection: 0.3,
      glassRefraction: 0.28,
      softSpecular: 0.56,
      chromaticAberration: 0.12,
    }),
    thumbnailSeed: 604.5,
  },
  {
    id: 'snow-mountain-dawn',
    title: '雪岭晨辉',
    subtitle: '六瓣冰晶与淡金晨光',
    inspirationType: 'landscape',
    inspirationName: '雪山晨光',
    petalMode: 'six',
    description: '水晶碎片、珍珠和浅蓝玻璃组成冷静六瓣结构，边缘带一点金色日出。',
    backgroundStory: '雪山晨光像被敲碎的冰片，六面镜让它稳定如雪花，灰尘和暗角保留镜筒摄影感。',
    colorPalette: palette('雪山冰蓝', ['#f1f8ff', '#a8d4f0', '#548fc4', '#eacb76']),
    materialObjects: materials([
      ['crystalShard', 1],
      ['glassBead', 0.66],
      ['pearl', 0.58],
      ['mineralStone', 0.4],
      ['paperFiber', 0.18],
      ['metalPin', 0.14],
    ]),
    visualMood: ['crystalline'],
    defaultParams: params(6, 0.06, 1.42, 0.34, 0.2, 1.08, 1.12, 0.18),
    effects: effects(0.24, 0.28, 0.2, 0.72, 0.26, 0.32, {
      macroDepthBlur: 0.3,
      centerSharpness: 0.9,
      mirrorImperfection: 0.2,
      glassRefraction: 0.24,
      edgeSoftness: 0.34,
      softSpecular: 0.5,
      chromaticAberration: 0.1,
    }),
    thumbnailSeed: 733.1,
  },
  {
    id: 'tropical-rainforest-light',
    title: '雨林翠影',
    subtitle: '七瓣湿润叶片与透明雨珠',
    inspirationType: 'garden',
    inspirationName: '热带雨林',
    petalMode: 'seven',
    description: '深浅绿色叶片、雨珠和矿石碎片构成湿润密集的外圈，带自然的不完美对称。',
    backgroundStory: '雨林碎光经过水珠折射，被七瓣镜筒轻轻错开，像手工放置的叶片和小石子。',
    colorPalette: palette('雨林碎光', ['#031a0b', '#087b2c', '#63e85b', '#13c7b8']),
    materialObjects: materials([
      ['leaf', 1],
      ['waterBubble', 0.84],
      ['mineralStone', 0.52],
      ['glassBead', 0.42],
      ['metalPin', 0.28],
      ['flowerPetal', 0.22],
    ]),
    visualMood: ['botanical'],
    defaultParams: params(7, 0.36, 1.12, 0.46, 0.04, 0.94, 1.12, 0.18),
    effects: effects(0.34, 0.36, 0.34, 0.82, 0.36, 0.46),
    thumbnailSeed: 812.6,
  },
  {
    id: 'desert-sunset-minerals',
    title: '沙原暮晶',
    subtitle: '六瓣矿石、贝壳与暖色亚克力',
    inspirationType: 'landscape',
    inspirationName: '沙漠日落',
    petalMode: 'six',
    description: '矿石颗粒、贝壳珠光和琥珀亚克力形成低饱和暖色，像砂砾里透出的日落。',
    backgroundStory: '沙漠日落被磨成矿石和贝壳碎片，六瓣结构让它像干燥、稳定的晶体标本。',
    colorPalette: palette('日落矿砂', ['#32160f', '#a95a31', '#eab26d', '#d4c4a6']),
    materialObjects: materials([
      ['mineralStone', 1],
      ['shell', 0.6],
      ['acrylicPiece', 0.52],
      ['paperFiber', 0.34],
      ['glassBead', 0.22],
      ['metalPin', 0.16],
    ]),
    visualMood: ['warm'],
    defaultParams: params(6, 0.18, 1.08, 0.32, 0.72, 0.96, 1.18, 0.1),
    effects: effects(0.38, 0.3, 0.22, 0.76, 0.42, 0.5),
    thumbnailSeed: 926.2,
  },
  {
    id: 'moonlit-white-rose',
    title: '月玫凝霜',
    subtitle: '八瓣珍珠白玫瑰与银色细丝',
    inspirationType: 'flower',
    inspirationName: '白玫瑰',
    petalMode: 'eight',
    description: '白色花瓣、珍珠和银色金属丝形成明亮而柔和的珠宝花轮。',
    backgroundStory: '月光照在白玫瑰和珍珠上，银色细丝在镜筒里划出微弯高光，边缘有轻微虚焦。',
    colorPalette: palette('月白玫瑰', ['#f8fbff', '#d8e3ee', '#b9c6dc', '#c6f6ff']),
    materialObjects: materials([
      ['flowerPetal', 1],
      ['pearl', 0.9],
      ['metalPin', 0.52],
      ['waterBubble', 0.34],
      ['crystalShard', 0.3],
      ['paperFiber', 0.18],
    ]),
    visualMood: ['botanical', 'crystalline'],
    defaultParams: params(8, 0.14, 1.28, 0.3, 0.02, 1.1, 1.04, 0.22),
    effects: effects(0.2, 0.4, 0.22, 0.56, 0.18, 0.24),
    thumbnailSeed: 104.3,
  },
  {
    id: 'city-neon-rain',
    title: '霓雨街灯',
    subtitle: '七瓣湿玻璃、亚克力与金属反光',
    inspirationType: 'city',
    inspirationName: '霓虹雨夜',
    petalMode: 'seven',
    description: '透明珠子、亚克力片和金属丝模拟雨夜橱窗，保留真实镜筒中的灰尘与错位。',
    backgroundStory: '城市雨夜的霓虹不再是抽象波纹，而是湿玻璃、亚克力碎片和金属针脚互相折射。',
    colorPalette: palette('霓虹雨窗', ['#090a18', '#0b7cff', '#e94b91', '#18e7d2']),
    materialObjects: materials([
      ['acrylicPiece', 0.9],
      ['glassBead', 0.82],
      ['metalPin', 0.74],
      ['waterBubble', 0.66],
      ['crystalShard', 0.36],
      ['mineralStone', 0.18],
    ]),
    visualMood: ['nocturne'],
    defaultParams: params(7, 0.62, 1.36, 0.58, 0.52, 0.98, 1.28, -0.04),
    effects: effects(0.4, 0.34, 0.36, 0.86, 0.48, 0.44),
    thumbnailSeed: 257.6,
  },
  {
    id: 'old-pages-golden-dust',
    title: '旧页金尘',
    subtitle: '六瓣纸纤维、珍珠与细金线',
    inspirationType: 'memory',
    inspirationName: '旧书页',
    petalMode: 'six',
    description: '纸张纤维、金属丝和珍珠构成低饱和纸本质感，画面有灰尘、暗角和浅浅阴影。',
    backgroundStory: '旧书页里夹着一小撮金色尘埃，经过镜筒后变成安静的六瓣纸花。',
    colorPalette: palette('旧纸金尘', ['#241c14', '#8f7653', '#d8c49b', '#f4d36a']),
    materialObjects: materials([
      ['paperFiber', 1],
      ['metalPin', 0.58],
      ['pearl', 0.34],
      ['shell', 0.3],
      ['mineralStone', 0.24],
      ['acrylicPiece', 0.12],
    ]),
    visualMood: ['archival', 'warm'],
    defaultParams: params(6, 0.28, 1.18, 0.28, 0.82, 0.92, 1.12, 0.12),
    effects: effects(0.52, 0.38, 0.26, 0.88, 0.72, 0.52),
    thumbnailSeed: 384.4,
  },
];

export const presets = artKaleidoscopePresets;

function params(
  segments: number,
  rotation: number,
  zoom: number,
  speed: number,
  colorShift: number,
  brightness: number,
  contrast: number,
  centerPull: number,
): VisualParameters {
  return {
    segments,
    rotation,
    zoom,
    speed,
    colorShift,
    brightness,
    contrast,
    centerPull,
  };
}

function palette(name: string, colors: [string, string, string, string]): ColorPalette {
  return {
    name,
    colors,
  };
}

function effects(
  grain: number,
  defocus: number,
  misalignment: number,
  vignette: number,
  dust: number,
  shadow: number,
  overrides: Partial<KaleidoscopeEffects> = {},
): KaleidoscopeEffects {
  return {
    grain,
    defocus,
    misalignment,
    vignette,
    dust,
    shadow,
    macroDepthBlur: defocus,
    centerSharpness: 0.8,
    lensVignette: vignette,
    subtleDust: dust,
    mirrorImperfection: misalignment,
    glassRefraction: 0.2 + misalignment * 0.32,
    edgeSoftness: 0.28 + defocus * 0.42,
    softSpecular: 0.42,
    chromaticAberration: 0.08 + misalignment * 0.12,
    ...overrides,
  };
}

function materials(entries: Array<[MaterialObjectType, number]>): MaterialObjectSpec[] {
  return entries.map(([type, amount]) => ({
    type,
    amount,
    label: materialLabel(type),
    visualSimulation: materialSimulationText(type),
  }));
}

function materialLabel(type: MaterialObjectType) {
  switch (type) {
    case 'glassBead':
      return '透明玻璃珠';
    case 'crystalShard':
      return '水晶碎片';
    case 'flowerPetal':
      return '半透明花瓣';
    case 'leaf':
      return '湿润叶片';
    case 'metalPin':
      return '弯曲金属丝';
    case 'pearl':
      return '珍珠';
    case 'shell':
      return '贝壳碎片';
    case 'acrylicPiece':
      return '亚克力片';
    case 'mineralStone':
      return '矿石颗粒';
    case 'waterBubble':
      return '水泡';
    case 'paperFiber':
      return '纸张纤维';
  }
}

function materialSimulationText(type: MaterialObjectType) {
  switch (type) {
    case 'glassBead':
      return '球面高光、边缘暗化、内部冰裂纹折射';
    case 'crystalShard':
      return '不规则切面、亮边、透明叠层和锐利法线';
    case 'flowerPetal':
      return '柔软半透明、自然边缘、花瓣纹理和浅阴影';
    case 'leaf':
      return '叶脉、深浅绿色、湿润反光和透明边缘';
    case 'metalPin':
      return '细线高光、弯曲轮廓、金属粗糙度';
    case 'pearl':
      return '珠光渐变、柔和边缘、低对比高光';
    case 'shell':
      return '低饱和珠光、细碎纹理、不规则边缘';
    case 'acrylicPiece':
      return '透明色片、硬边倒角、轻微玻璃折射';
    case 'mineralStone':
      return '颗粒噪声、暗裂纹、哑光阴影';
    case 'waterBubble':
      return '透明圆膜、双层边缘、亮点反光';
    case 'paperFiber':
      return '纤维线、纸面颗粒、暖色灰尘';
  }
}
