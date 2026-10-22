precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uSegments;
uniform float uRotation;
uniform float uZoom;
uniform float uColorShift;
uniform float uBrightness;
uniform float uContrast;
uniform float uCenterPull;
uniform float uSeed;
uniform float uPetalMode;
uniform vec3 uPalette0;
uniform vec3 uPalette1;
uniform vec3 uPalette2;
uniform vec3 uPalette3;
uniform vec4 uMaterialA;
uniform vec4 uMaterialB;
uniform vec4 uMaterialC;
uniform vec4 uEffects;
uniform vec4 uEffects2;
uniform vec4 uEffects3;
uniform vec4 uEffects4;

uniform sampler2D uTexFlowerColor;
uniform sampler2D uTexFlowerAlpha;
uniform sampler2D uTexLeafColor;
uniform sampler2D uTexLeafAlpha;
uniform sampler2D uTexIceColor;
uniform sampler2D uTexCrystalColor;
uniform sampler2D uTexStoneColor;
uniform sampler2D uTexPaperColor;
uniform sampler2D uTexMetalColor;
uniform sampler2D uTexDust;
uniform sampler2D uUserImage;
uniform float uUserImageEnabled;
uniform vec4 uUserImageParams;
uniform float uUserImageAspect;
uniform float uIntroProgress;
uniform float uIntroTime;
uniform vec4 uIntroLayers;

varying vec2 vUv;

const float TAU = 6.28318530718;

mat2 rotate2d(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = rotate2d(0.68) * p * 2.04 + 4.3;
    a *= 0.48;
  }
  return v;
}

float softMask(float d, float s) {
  return 1.0 - smoothstep(-s, s, d);
}

float sdEllipse(vec2 p, vec2 r) {
  return length(p / r) - 1.0;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float sdShard(vec2 p, float seed) {
  float a = atan(p.y, p.x);
  float r = length(p);
  float edge = 0.34 + 0.065 * sin(a * 3.0 + seed * 4.0) + 0.035 * sin(a * 5.0 - seed);
  return r - edge;
}

vec3 palette(float t) {
  t = fract(t + uColorShift * 0.34);
  vec3 a = mix(uPalette0, uPalette1, smoothstep(0.0, 0.42, t));
  vec3 b = mix(uPalette2, uPalette3, smoothstep(0.36, 1.0, t));
  return mix(a, b, smoothstep(0.24, 0.88, t));
}

float chooseMaterial(float t) {
  float total = max(0.0, uMaterialA.x) + max(0.0, uMaterialA.y) + max(0.0, uMaterialA.z) + max(0.0, uMaterialA.w);
  total += max(0.0, uMaterialB.x) + max(0.0, uMaterialB.y) + max(0.0, uMaterialB.z) + max(0.0, uMaterialB.w);
  total += max(0.0, uMaterialC.x) + max(0.0, uMaterialC.y) + max(0.0, uMaterialC.z) + 0.001;
  float c = t * total;
  float r = 0.0;
  r += max(0.0, uMaterialA.x); if (c <= r) return 0.0;
  r += max(0.0, uMaterialA.y); if (c <= r) return 1.0;
  r += max(0.0, uMaterialA.z); if (c <= r) return 2.0;
  r += max(0.0, uMaterialA.w); if (c <= r) return 3.0;
  r += max(0.0, uMaterialB.x); if (c <= r) return 4.0;
  r += max(0.0, uMaterialB.y); if (c <= r) return 5.0;
  r += max(0.0, uMaterialB.z); if (c <= r) return 6.0;
  r += max(0.0, uMaterialB.w); if (c <= r) return 7.0;
  r += max(0.0, uMaterialC.x); if (c <= r) return 8.0;
  r += max(0.0, uMaterialC.y); if (c <= r) return 9.0;
  return 10.0;
}

vec2 materialUv(vec2 p, float seed, float scale) {
  vec2 uv = rotate2d(seed * 5.1) * p * scale + vec2(0.5);
  uv += vec2(hash(vec2(seed, 2.1)), hash(vec2(seed, 6.8))) * 0.28;
  return fract(uv);
}

vec4 sampleMaterialTexture(float id, vec2 uv) {
  vec4 sampled = vec4(texture2D(uTexPaperColor, uv * 1.7).rgb, 1.0);
  if (id < 0.5) sampled = vec4(texture2D(uTexIceColor, uv).rgb, 1.0);
  else if (id < 1.5) sampled = vec4(texture2D(uTexCrystalColor, uv).rgb, 1.0);
  else if (id < 2.5) sampled = vec4(texture2D(uTexFlowerColor, uv).rgb, texture2D(uTexFlowerAlpha, uv).r);
  else if (id < 3.5) sampled = vec4(texture2D(uTexLeafColor, uv).rgb, texture2D(uTexLeafAlpha, uv).r);
  else if (id < 4.5) sampled = vec4(texture2D(uTexMetalColor, uv).rgb, 1.0);
  else if (id < 5.5) sampled = vec4(texture2D(uTexStoneColor, uv).rgb, 1.0);
  else if (id < 6.5) sampled = vec4(texture2D(uTexStoneColor, uv * 1.2).rgb, 1.0);
  else if (id < 7.5) sampled = vec4(texture2D(uTexIceColor, uv * 1.25).rgb, 1.0);
  else if (id < 8.5) sampled = vec4(texture2D(uTexCrystalColor, uv * 1.45).rgb, 1.0);
  else if (id < 9.5) sampled = vec4(texture2D(uTexIceColor, uv * 0.85).rgb, 1.0);
  return sampled;
}

vec4 objectColor(vec2 p, float id, vec3 base, float seed, float depth, float ring) {
  p = rotate2d(seed * TAU) * p;
  float rough = 0.45;
  float transmit = 0.1;
  float metal = 0.0;
  float d = 1.0;
  float h = 0.35;
  vec2 nudge = vec2(0.0);

  if (id < 0.5) {
    float r = length(p);
    d = r - (0.32 + (fbm(p * 8.0 + seed) - 0.5) * 0.02);
    h = sqrt(max(0.0, 1.0 - pow(r / 0.34, 2.0)));
    rough = 0.08;
    transmit = 0.82;
    nudge = -p * 2.1;
  } else if (id < 1.5) {
    d = sdShard(p * vec2(0.9, 1.15), seed);
    h = 0.46 + fbm(p * 9.0 + seed) * 0.38;
    rough = 0.18;
    transmit = 0.64;
    nudge = vec2(sin(p.y * 8.0), cos(p.x * 7.0)) * 0.35;
  } else if (id < 2.5) {
    p.x += sin(p.y * 7.0 + seed) * 0.03;
    d = sdEllipse(p + vec2(0.0, 0.04), vec2(0.24 + (fbm(p * 6.0 + seed) - 0.5) * 0.04, 0.48));
    h = 0.28 + (1.0 - abs(p.y) / 0.5) * 0.36;
    rough = 0.78;
    transmit = 0.36;
    nudge = vec2(-p.x * 0.38, 0.22);
  } else if (id < 3.5) {
    d = sdEllipse(p, vec2(0.25, 0.45));
    h = 0.34 + (1.0 - smoothstep(0.0, 0.035, abs(p.x))) * 0.28;
    rough = 0.58;
    transmit = 0.18;
    nudge = vec2(0.12, 0.18);
  } else if (id < 4.5) {
    p.y += sin(p.x * 7.0 + seed) * 0.035;
    d = sdSegment(p, vec2(-0.47, 0.0), vec2(0.45, 0.0)) - 0.018;
    h = 1.0 - smoothstep(0.0, 0.065, abs(p.y));
    rough = 0.2;
    metal = 0.9;
    nudge = vec2(0.0, -p.y * 5.0);
  } else if (id < 5.5) {
    float r = length(p);
    d = r - 0.29;
    h = sqrt(max(0.0, 1.0 - pow(r / 0.31, 2.0)));
    rough = 0.34;
    transmit = 0.14;
    nudge = -p * 1.8;
  } else if (id < 6.5) {
    d = sdEllipse(p, vec2(0.36, 0.23));
    h = 0.36 + smoothstep(0.88, 1.0, sin((p.x + abs(p.y) * 0.6) * 28.0 + seed)) * 0.28;
    rough = 0.66;
    transmit = 0.08;
    nudge = vec2(0.15, 0.1);
  } else if (id < 7.5) {
    vec2 q = abs(p);
    d = max(q.x * 0.86 + q.y * 0.58 - 0.36, q.y - 0.28);
    h = 0.42 + smoothstep(0.08, 0.0, abs(d)) * 0.34;
    rough = 0.22;
    transmit = 0.62;
    nudge = vec2(0.36, 0.18);
  } else if (id < 8.5) {
    d = sdShard(p * vec2(1.1, 0.82), seed);
    h = 0.36 + fbm(p * 10.0 + seed) * 0.44;
    rough = 0.82;
    nudge = vec2(fbm(p * 6.0), fbm(p * 6.0 + 8.0)) - 0.5;
  } else if (id < 9.5) {
    float r = length(p);
    d = r - (0.3 + (fbm(p * 8.0 + seed) - 0.5) * 0.018);
    h = sqrt(max(0.0, 1.0 - pow(r / 0.32, 2.0)));
    rough = 0.05;
    transmit = 0.9;
    nudge = -p * 1.9;
  } else {
    p.y += sin(p.x * 7.0 + seed) * 0.025;
    d = sdSegment(p, vec2(-0.46, 0.0), vec2(0.43, sin(seed) * 0.08)) - 0.008;
    h = 0.28 + fbm(p * 18.0 + seed) * 0.2;
    rough = 0.9;
    transmit = 0.04;
    nudge = vec2(0.0, 0.08);
  }

  float alpha = softMask(d, 0.055);
  vec2 uv = materialUv(p + nudge * 0.04, seed, mix(0.9, 1.8, hash(vec2(seed, 4.0))));
  vec4 texel = sampleMaterialTexture(id, uv);
  if (id >= 2.0 && id < 4.0) {
    alpha *= smoothstep(0.08, 0.72, texel.a);
  } else {
    alpha *= mix(0.42, 1.0, texel.a);
  }

  float lum = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
  vec3 material = mix(base, texel.rgb * base * 1.55 + vec3(lum) * 0.18, 0.68);
  float photoScale = max(0.22, uUserImageParams.z);
  vec2 photoUv = fract(
    (uv - 0.5) / photoScale +
    0.5 +
    vec2(hash(vec2(seed, 19.1)), hash(vec2(seed, 31.7))) * 0.18
  );
  vec3 photo = texture2D(uUserImage, photoUv).rgb;
  float photoLum = dot(photo, vec3(0.299, 0.587, 0.114));
  vec3 photoMaterial = mix(photo, vec3(photoLum), 0.16) * (0.82 + base * 0.46);
  float coverageThreshold = 1.0 - clamp(uUserImageParams.w, 0.02, 1.0);
  float photoPresence = uUserImageParams.x *
    smoothstep(coverageThreshold, 1.0, hash(vec2(seed, id + 4.0)));
  float photoOnTransparent = smoothstep(0.18, 0.85, transmit);
  float photoMix = photoPresence * uUserImageParams.y * mix(0.72, 0.96, photoOnTransparent);
  material = mix(material, photoMaterial, photoMix);
  rough = mix(rough, max(0.22, rough), photoMix);

  vec3 lightDir = normalize(vec3(-0.42, 0.58, 0.7));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 normal = normalize(vec3(nudge * 0.75, 0.64 + h * 0.72));
  float diff = max(dot(normal, lightDir), 0.0);
  float spec = pow(max(dot(normal, normalize(lightDir + viewDir)), 0.0), mix(18.0, 110.0, 1.0 - rough));
  float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);
  float back = transmit * smoothstep(-0.2, 0.85, dot(normal, -lightDir));
  vec3 specColor = mix(vec3(0.94, 0.9, 0.82), vec3(0.78, 0.92, 1.0), transmit);

  vec3 lit = material * (0.42 + diff * 0.74 + back * 0.28);
  lit += specColor * spec * (0.45 + transmit * 0.55) * alpha;
  lit += specColor * rim * (0.14 + transmit * 0.24);
  lit *= 1.0 + ring * 0.08;
  lit = mix(lit, vec3(dot(lit, vec3(0.333))), metal * 0.12);

  return vec4(lit, alpha * mix(0.62, 0.86, transmit + metal));
}

vec4 over(vec4 bottom, vec4 top, vec2 local, float depth) {
  float shadow = smoothstep(0.04, 0.5, length(local)) * top.a * uEffects2.y * (0.12 + depth * 0.08);
  bottom.rgb *= 1.0 - shadow;
  float a = clamp(top.a, 0.0, 0.92);
  return vec4(mix(bottom.rgb, top.rgb, a), a + bottom.a * (1.0 - a));
}

vec2 userImageCoverUv(vec2 uv) {
  vec2 q = uv - 0.5;
  if (uUserImageAspect > 1.0) {
    q.x /= uUserImageAspect;
  } else {
    q.y *= uUserImageAspect;
  }
  return q + 0.5;
}

float userPhotoBounds(vec2 uv) {
  vec2 d = abs(uv - 0.5);
  return smoothstep(0.54, 0.46, max(d.x, d.y));
}

vec3 sampleUserPhoto(vec2 uv) {
  vec2 covered = userImageCoverUv(clamp(uv, 0.001, 0.999));
  vec3 c = texture2D(uUserImage, covered).rgb;
  vec3 soft = (
    texture2D(uUserImage, userImageCoverUv(clamp(uv + vec2(0.002, 0.0), 0.001, 0.999))).rgb +
    texture2D(uUserImage, userImageCoverUv(clamp(uv + vec2(-0.002, 0.0), 0.001, 0.999))).rgb +
    texture2D(uUserImage, userImageCoverUv(clamp(uv + vec2(0.0, 0.002), 0.001, 0.999))).rgb +
    texture2D(uUserImage, userImageCoverUv(clamp(uv + vec2(0.0, -0.002), 0.001, 0.999))).rgb
  ) * 0.25;
  return clamp(c * 1.18 - soft * 0.18, 0.0, 1.0);
}

vec4 photoLensLayer(vec2 folded, vec2 anchor, float photoScale, float angleOffset, vec2 lensScale, float feather) {
  vec2 local = rotate2d(angleOffset) * (folded - anchor);
  vec2 uv = local / max(0.12, photoScale) + 0.5;
  float lens = 1.0 - smoothstep(0.78, 1.0, length(local / lensScale));
  lens *= userPhotoBounds(uv);
  vec3 photo = sampleUserPhoto(uv);
  return vec4(photo, lens * feather);
}

vec4 uploadedPhotoKaleidoscope(vec2 folded, vec2 centered, float radius, float angle, float seam) {
  float subjectScale = mix(0.42, 1.12, clamp(uUserImageParams.z / 2.2, 0.0, 1.0));
  float strength = clamp(uUserImageParams.y, 0.0, 1.0);
  float coverage = clamp(uUserImageParams.w, 0.0, 1.0);
  float ring = smoothstep(0.06, 0.82, radius) * (1.0 - smoothstep(1.38, 1.82, radius));

  vec2 shimmer = vec2(
    fbm(centered * 3.6 + uSeed * 0.07),
    fbm(centered * 3.9 - uSeed * 0.06)
  ) - 0.5;
  vec2 opticalFold = folded + shimmer * uEffects2.z * 0.018;

  vec3 darkGlass = mix(uPalette0 * 0.18, vec3(0.015, 0.018, 0.026), 0.62);
  darkGlass += uPalette1 * (0.05 + ring * 0.08);
  vec4 color = vec4(darkGlass, 1.0);

  vec4 mainPhoto = photoLensLayer(
    opticalFold,
    vec2(0.18, 0.015),
    0.34 + subjectScale * 0.38,
    -0.08 + uRotation * 0.08,
    vec2(0.72, 0.58),
    0.98
  );

  vec4 innerPhoto = photoLensLayer(
    opticalFold,
    vec2(0.035, 0.0),
    0.28 + subjectScale * 0.22,
    0.34,
    vec2(0.42, 0.34),
    0.72
  );

  vec4 outerPhoto = photoLensLayer(
    opticalFold,
    vec2(0.58, 0.055 + sin(angle * 3.0 + uSeed) * 0.018),
    0.24 + subjectScale * 0.2,
    -0.42,
    vec2(0.36, 0.25),
    0.58 * coverage
  );

  vec4 haloPhoto = photoLensLayer(
    opticalFold,
    vec2(0.86, -0.035),
    0.2 + subjectScale * 0.16,
    0.72,
    vec2(0.28, 0.2),
    0.36 * coverage
  );

  color = over(color, mainPhoto, opticalFold - vec2(0.18, 0.015), 0.18);
  color = over(color, innerPhoto, opticalFold - vec2(0.035, 0.0), 0.08);
  color = over(color, outerPhoto, opticalFold - vec2(0.58, 0.055), 0.38);
  color = over(color, haloPhoto, opticalFold - vec2(0.86, -0.035), 0.58);

  float seamLine = smoothstep(0.88, 0.06, seam) * (0.18 + uEffects2.z * 0.16);
  float radialGlass = smoothstep(0.0, 0.045, abs(fract(radius * 3.15 + 0.16) - 0.5));
  vec3 prism = mix(vec3(0.9, 0.96, 1.0), uPalette3, 0.36);
  color.rgb += prism * seamLine * 0.26;
  color.rgb += prism * (1.0 - radialGlass) * ring * 0.16;

  float highlight = pow(max(0.0, 0.5 + 0.5 * cos(angle * uSegments * 2.0 - radius * 5.7)), 8.0);
  color.rgb += vec3(0.96, 0.92, 0.82) * highlight * ring * uEffects3.w * 0.24;
  color.rgb = mix(darkGlass, color.rgb, 0.42 + strength * 0.58);

  float edgeBlur = smoothstep(0.78, 1.65, radius) * uEffects3.x * 0.16;
  vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
  color.rgb = mix(color.rgb, gray, edgeBlur);
  color.rgb *= 1.0 - smoothstep(1.38, 1.86, radius) * 0.28;
  return color;
}

vec2 foldMirror(vec2 centered, out float radius, out float angle, out float seam) {
  radius = length(centered);
  angle = atan(centered.y, centered.x);
  float pulled = radius * (1.0 - uCenterPull * (1.0 - smoothstep(0.0, 1.1, radius)) * 0.34);
  float theta = angle + uRotation + uTime * 0.016;
  float segments = max(3.0, floor(uSegments + 0.5));
  float seg = TAU / segments;
  float index = floor((theta + seg * 0.5) / seg);
  float local = mod(theta + seg * 0.5, seg) - seg * 0.5;
  seam = 1.0 - smoothstep(0.0, seg * 0.16, abs(abs(local) - seg * 0.5));
  float imperfection = uEffects2.z;
  local += (hash(vec2(index, uSeed)) - 0.5) * imperfection * 0.055;
  local += (fbm(vec2(local * 7.0, radius * 4.0 + uSeed)) - 0.5) * imperfection * 0.035;
  float folded = abs(local);
  vec2 p = vec2(cos(folded), sin(folded)) * pulled / max(uZoom, 0.001);
  return rotate2d(uRotation * 0.14 + uTime * 0.008) * p;
}

vec4 objectField(vec2 p, float sourceRadius, float sourceAngle, float seam) {
  float imageMode = uUserImageParams.x;
  float density = 3.8 + smoothstep(6.0, 8.0, uPetalMode) * 1.2 + uMaterialC.w * 0.5;
  vec2 fieldUv = p * density + vec2(uTime * 0.004, -uTime * 0.007);
  float ring = smoothstep(0.1, 0.72, sourceRadius) * (1.0 - smoothstep(1.28, 1.78, sourceRadius));
  vec3 ground = texture2D(uTexPaperColor, fract(fieldUv * 0.08 + uSeed * 0.002)).rgb;
  vec4 color = vec4(mix(uPalette0 * 0.22 + uPalette1 * 0.1, ground * uPalette0 * 0.9, 0.42), 1.0);
  vec2 sourcePhotoUv = fract((fieldUv * 0.11) / max(0.35, uUserImageParams.z) + vec2(0.09, 0.17));
  vec3 sourcePhoto = texture2D(uUserImage, sourcePhotoUv).rgb;
  color.rgb = mix(color.rgb, sourcePhoto * 0.42 + vec3(dot(sourcePhoto, vec3(0.333))) * 0.08, imageMode * 0.72);

  for (int layer = 0; layer < 4; layer++) {
    float lf = float(layer);
    vec2 layerUv = fieldUv * (0.68 + lf * 0.22) + vec2(0.37, 0.61) * lf + uSeed * vec2(0.013, 0.021);
    vec2 cell = floor(layerUv);
    float seed = hash(cell + uSeed * 1.37 + lf * 21.0);
    vec2 center = cell + 0.5 + (vec2(hash(cell + 3.1), hash(cell + 9.7)) - 0.5) * (0.3 + uEffects2.z * 0.1);
    vec2 cellLocal = layerUv - center;
    float size = mix(0.78, 1.22, hash(cell + 17.3 + lf)) * (1.0 + lf * 0.04);
    vec2 local = cellLocal / size;
    float id = chooseMaterial(hash(cell + uSeed * 2.0 + lf * 9.0));
    float photoShape = hash(cell + uSeed * 4.0 + lf * 3.7);
    if (imageMode > 0.5) {
      id = 7.0;
      if (photoShape < 0.28) id = 0.0;
      else if (photoShape < 0.5) id = 1.0;
      else if (photoShape < 0.68) id = 5.0;
      else if (photoShape < 0.82) id = 8.0;
    }
    vec3 base = palette(hash(cell + uSeed * 0.71) + sourceRadius * 0.22 + lf * 0.13);
    vec2 objectPhotoUv = fract((cell * 0.137 + vec2(hash(cell), hash(cell + 9.0))) / max(0.35, uUserImageParams.z));
    vec3 objectPhoto = texture2D(uUserImage, objectPhotoUv).rgb;
    base = mix(base, objectPhoto * 1.08 + vec3(dot(objectPhoto, vec3(0.333))) * 0.12, imageMode * 0.88);
    vec4 object = objectColor(local, id, base, seed + uSeed, lf * 0.33, ring);
    float cellEdge = max(abs(layerUv.x - (cell.x + 0.5)), abs(layerUv.y - (cell.y + 0.5)));
    float cellFade = 1.0 - smoothstep(0.38, 0.49, cellEdge);
    float organicFade = 1.0 - smoothstep(0.16, 0.64, length(cellLocal));
    object.a *= (0.82 + ring * 0.28) * (1.0 - lf * 0.045);
    object.a *= mix(1.0, 1.18, imageMode);
    object.a *= cellFade * organicFade;
    object.a *= 1.0 - seam * uEffects2.z * 0.12;
    color = over(color, object, local, lf * 0.33);
  }

  float center = smoothstep(0.42, 0.02, sourceRadius);
  float petal = pow(max(0.0, 0.5 + 0.5 * cos(sourceAngle * uSegments * 2.0 + uRotation - sourceRadius * 9.0)), 4.0);
  color.rgb += palette(0.62) * center * (0.07 + petal * 0.22);
  color.rgb *= 1.0 + (fbm(p * 2.6 + uSeed) - 0.5) * uEffects2.z * 0.12;
  return color;
}

vec3 postProcess(vec2 centered, vec3 color, float radius, float seam) {
  float edge = smoothstep(0.56, 1.62, radius);
  float blur = uEffects3.x * edge * 0.22;
  vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
  color = mix(color, gray, blur);

  float vignette = smoothstep(1.72, 0.18, radius);
  color *= mix(1.0 - uEffects4.y * 0.42, 1.0, vignette);
  color = mix(color, color * 0.82, edge * uEffects3.z * 0.2);

  float sheen = smoothstep(0.95, 0.0, length(centered - vec2(-0.15, 0.12))) * uEffects3.w * 0.12;
  color += vec3(0.95, 0.98, 1.0) * sheen;

  vec2 dustUv = fract(vUv * vec2(1.0, uResolution.y / max(uResolution.x, 1.0)) * 1.8 + uSeed * 0.002);
  float dust = texture2D(uTexDust, dustUv).r * 0.08;
  dust += smoothstep(0.985 - uEffects4.z * 0.08, 1.0, hash(gl_FragCoord.xy * 0.37 + uSeed)) * 0.22;
  color -= vec3(0.12, 0.105, 0.09) * dust * uEffects4.z;

  color += (hash(gl_FragCoord.xy + floor(uTime * 16.0) + uSeed) - 0.5) * uEffects.x * 0.045;
  color = mix(color, gray, seam * uEffects2.z * 0.12);
  color *= 1.0 - seam * uEffects2.z * 0.04;

  float ca = uEffects4.x * edge * 0.014;
  color.r += ca;
  color.b -= ca * 0.65;
  return color;
}

float radialReveal(float radius, float reveal, float feather) {
  return 1.0 - smoothstep(reveal - feather, reveal + feather, radius);
}

float introRevealMask(vec2 centered, float radius, float angle) {
  if (uIntroProgress > 0.998) {
    return 1.0;
  }

  float opticalNoise = (fbm(centered * 3.2 + uSeed * 0.03) - 0.5) * 0.08;
  float petalBreath = 0.92 + 0.08 * cos(angle * uSegments * 2.0 - uIntroTime * 1.4);
  float centerReveal = mix(0.045, 0.34, uIntroLayers.x);
  float middleReveal = mix(0.08, 0.92, uIntroLayers.y);
  float outerReveal = mix(0.18, 1.95, uIntroLayers.z);

  float centerLayer = radialReveal(radius, centerReveal + opticalNoise * 0.2, 0.075);
  float middleLayer =
    radialReveal(radius, middleReveal + opticalNoise * 0.45, 0.12) *
    smoothstep(0.12, 0.34, radius) *
    petalBreath;
  float outerLayer =
    radialReveal(radius, outerReveal + opticalNoise, 0.17) *
    smoothstep(0.44, 1.04, radius);

  float faintIris = radialReveal(radius, mix(0.045, 2.0, uIntroProgress), 0.22) * uIntroProgress * 0.18;
  return clamp(max(max(centerLayer, middleLayer * 0.95), max(outerLayer * 0.92, faintIris)), 0.0, 1.0);
}

vec3 applyIntroReveal(vec2 centered, vec3 color, float radius, float angle) {
  if (uIntroProgress > 0.998) {
    return color;
  }

  float mask = introRevealMask(centered, radius, angle);
  vec3 dormantGlass = vec3(0.004, 0.006, 0.012) + uPalette0 * 0.035;
  float core = radialReveal(radius, mix(0.035, 0.22, uIntroLayers.x), 0.06);
  float ringFlash = smoothstep(0.028, 0.0, abs(radius - mix(0.08, 1.28, uIntroProgress))) * 0.34;
  float startupGlow = core * (1.0 - uIntroProgress * 0.55) + ringFlash * (1.0 - uIntroProgress * 0.25);
  vec3 glowColor = mix(uPalette2, vec3(0.86, 0.96, 1.0), 0.42);

  color = mix(dormantGlass, color, mask);
  color += glowColor * startupGlow * 0.28;
  color *= mix(0.56, 1.0, smoothstep(0.08, 1.0, uIntroProgress));
  return color;
}

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  centered.x *= uResolution.x / max(uResolution.y, 1.0);
  float introSpin = (1.0 - uIntroProgress) * (0.42 + uIntroTime * 0.12);
  float introScale = mix(1.05, 1.0, smoothstep(0.18, 1.0, uIntroProgress));
  centered = rotate2d(introSpin) * centered / introScale;

  float radius;
  float angle;
  float seam;
  vec2 folded = foldMirror(centered, radius, angle, seam);

  float glass = uEffects2.w;
  vec2 glassOffset = vec2(fbm(centered * 3.8 + uSeed), fbm(centered * 4.1 - uSeed)) - 0.5;
  folded += glassOffset * glass * smoothstep(0.36, 1.45, radius) * 0.028;

  vec3 color;
  if (uUserImageParams.x > 0.5) {
    color = uploadedPhotoKaleidoscope(folded, centered, radius, angle, seam).rgb;
  } else {
    color = objectField(folded, radius, angle, seam).rgb;
  }
  color = postProcess(centered, color, radius, seam);
  color = applyIntroReveal(centered, color, radius, angle);
  color = (color - 0.5) * uContrast + 0.5;
  color *= uBrightness;
  color = color / (1.0 + max(color, 0.0) * 0.34);
  color = pow(max(color, 0.0), vec3(0.92));

  gl_FragColor = vec4(color, 1.0);
}
