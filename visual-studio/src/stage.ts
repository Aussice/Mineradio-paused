import { FireworksRenderer, initialSettings, type FireworksSettings } from './engine/FireworksRenderer';
import { KaleidoscopeRenderer } from './engine/KaleidoscopeRenderer';
import { AudioEngine, type AudioBands } from './engine/AudioEngine';
import { defaultKaleidoscopeState, type KaleidoscopeState } from './store/kaleidoscopeStore';
import { artKaleidoscopePresets } from './presets';
import './stage.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const host = $('stage');
const embedded = window.parent !== window;
const origin = location.origin;
let mode: 'fireworks' | 'kaleidoscope' = new URLSearchParams(location.search).get('mode') === 'kaleidoscope' ? 'kaleidoscope' : 'fireworks';
let fireworks: FireworksRenderer | null = null;
let kaleidoscope: KaleidoscopeRenderer | null = null;
const localAudio = new AudioEngine();
let external: AudioBands = { bass: 0, mid: 0, high: 0, energy: 0 };
let externalActive = false;
let receivedAt = 0;
let lastTime = performance.now();
let frame = 0;
let panelOpen = !embedded;
let reactivity = 0.7;
let requestingMic = false;
let requestingDemo = false;
let settings: FireworksSettings = { ...initialSettings };
let kaleidoSettings: KaleidoscopeState = { ...defaultKaleidoscopeState };
try { settings = { ...settings, ...JSON.parse(localStorage.getItem('visual-theater-settings') || '{}') }; } catch { /* A damaged preference must not stop playback. */ }
function save() { localStorage.setItem('visual-theater-settings', JSON.stringify(settings)); }
function notify(type: string, extra: Record<string, unknown> = {}) { if (embedded) parent.postMessage({ type, ...extra }, origin); }
function error(message: string) { $('stage-error').textContent = message; $('stage-error').hidden = false; }
function clearError() { $('stage-error').hidden = true; }
function updateStatus() {
  const mic = localAudio.mode === 'mic' && localAudio.playing;
  $('mic-button').textContent = mic ? '关闭麦克风' : requestingMic ? '正在请求…' : '开启麦克风';
  $('demo-button').textContent = localAudio.playing && !mic ? '暂停试听' : '试听音乐';
  $('source-status').textContent = mic ? '正在聆听麦克风 · 声音仅在本机分析' : externalActive ? '正在跟随播放器 · 换歌后会自动同步' : localAudio.playing ? 'Midnight in Bloom · 原创试听音乐' : '自由预演 · 播放音乐后将跟随节奏';
}
function setPanel(open: boolean) {
  panelOpen = open; $('stage-panel').hidden = !open;
  if (fireworks) fireworks.rightInset = open && innerWidth > 850 ? 330 : 0;
  notify('visual-theater-panel-state', { open });
}
function setMode(next: typeof mode) {
  fireworks?.dispose(); kaleidoscope?.dispose(); fireworks = null; kaleidoscope = null; host.replaceChildren();
  mode = next;
  try {
    if (mode === 'fireworks') {
      const canvas = document.createElement('canvas'); host.appendChild(canvas);
      fireworks = new FireworksRenderer(canvas); fireworks.settings = { ...settings }; fireworks.rightInset = panelOpen ? 330 : 0;
      fireworks.onBoom = (distance, strength) => localAudio.boom(distance, strength);
      fireworks.resize(innerWidth, innerHeight); fireworks.seed();
    } else {
      kaleidoscope = new KaleidoscopeRenderer(host, kaleidoSettings, { preserveDrawingBuffer: true, renderScale: 0.8 }); kaleidoscope.start();
    }
    $('fireworks-controls').hidden = mode !== 'fireworks'; $('kaleidoscope-controls').hidden = mode !== 'kaleidoscope';
    $('stage-title').textContent = mode === 'fireworks' ? '音乐烟花' : '万花筒';
    $('stage-intro').textContent = mode === 'fireworks' ? '把声音，交给夜空。' : '让每一个节拍，折射成光。';
    $('stage-mode-label').textContent = mode === 'fireworks' ? 'SOUND TO FIREWORKS' : 'KALEIDOSCOPE STUDIO';
    $('stage-hint').textContent = mode === 'fireworks' ? '点击夜空，点燃一朵烟花' : '音乐正在镜面之间，流转成形';
    clearError();
  } catch (cause) {
    console.error(cause); error('视觉舞台暂时无法启动，请更新显卡驱动或切回原生舞台。'); notify('visual-theater-error');
  }
}
function animate(now: number) {
  frame = requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
  if (document.hidden) return;
  const liveExternal = externalActive && now - receivedAt < 1200;
  const local = localAudio.playing;
  const bands = local ? localAudio.read() : liveExternal ? external : { bass: 0, mid: 0, high: 0, energy: 0 };
  fireworks?.update(dt, bands, local || liveExternal, !local && !liveExternal);
  kaleidoscope?.setAudioResponse(bands.bass * reactivity, bands.mid * reactivity, bands.high * reactivity);
  if (local && localAudio.mode !== 'mic' && localAudio.position >= localAudio.duration) { localAudio.pause(); void localAudio.seek(0); updateStatus(); }
}
host.addEventListener('pointerdown', event => { if (mode === 'fireworks') fireworks?.burst(event.clientX / innerWidth, event.clientY / innerHeight, event.shiftKey ? 'halo' : 'burst'); });
window.addEventListener('resize', () => fireworks?.resize(innerWidth, innerHeight));
window.addEventListener('message', event => {
  if (event.origin !== origin || event.source !== parent || !event.data || typeof event.data.type !== 'string') return;
  const data = event.data;
  if (data.type === 'visual-theater-audio') {
    const bounded = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
    external = { bass: bounded(data.bass), mid: bounded(data.mid), high: bounded(data.high), energy: bounded(data.energy) };
    const changed = externalActive !== (data.playing === true); externalActive = data.playing === true; receivedAt = performance.now();
    if (externalActive && localAudio.playing) { localAudio.stopMic(); localAudio.pause(); }
    if (changed) updateStatus();
  }
  if (data.type === 'visual-theater-mode' && (data.mode === 'fireworks' || data.mode === 'kaleidoscope')) setMode(data.mode);
  if (data.type === 'visual-theater-controls') setPanel(data.open === true);
  if (data.type === 'visual-theater-launch' && typeof data.x === 'number' && typeof data.y === 'number') fireworks?.burst(Math.max(0, Math.min(1, data.x)), Math.max(0, Math.min(1, data.y)), data.halo === true ? 'halo' : 'burst');
  if (data.type === 'visual-theater-microphone-ready' && requestingMic) {
    if (data.allowed === true) void startMic();
    else { requestingMic = false; updateStatus(); error('麦克风权限未能开启，请在 Windows 隐私设置中允许此应用访问麦克风。'); }
  }
  if (data.type === 'visual-theater-demo-ready' && requestingDemo) {
    requestingDemo = false;
    $<HTMLButtonElement>('demo-button').disabled = false;
    if (data.allowed === true) void startDemo();
    else error('播放器正在切换歌曲，请稍后再次试听。');
  }
});
async function startDemo() {
  try { externalActive = false; await localAudio.useDemo(); clearError(); updateStatus(); }
  catch { error('试听音乐未能启动，请再次点击播放。'); }
}
async function startMic() {
  try { await localAudio.microphone(); clearError(); } catch { error('无法访问麦克风。请检查系统权限，以及输入设备是否已连接。'); }
  requestingMic = false; updateStatus();
}
$('mic-button').onclick = async () => {
  if (requestingMic) return;
  if (localAudio.mode === 'mic') { localAudio.stopMic(); updateStatus(); return; }
  requestingMic = true; updateStatus(); clearError();
  if (embedded) notify('visual-theater-microphone-request'); else await startMic();
};
$('demo-button').onclick = async () => {
  try {
    if (localAudio.playing && localAudio.mode !== 'mic') localAudio.pause();
    else if (embedded) { requestingDemo = true; $<HTMLButtonElement>('demo-button').disabled = true; notify('visual-theater-play-demo-request'); }
    else await startDemo();
    clearError(); updateStatus();
  } catch { error('试听音乐未能启动，请再次点击播放。'); }
};
$('close-panel').onclick = () => setPanel(false);
$('launch-finale').onclick = () => fireworks?.finale();
for (const key of ['intensity', 'sensitivity', 'bloom', 'gravity', 'wind'] as const) {
  const input = $<HTMLInputElement>(key); input.value = String(settings[key]); $(key + '-value').textContent = settings[key] + '%';
  input.oninput = () => { settings[key] = Number(input.value); if (fireworks) fireworks.settings[key] = settings[key]; $(key + '-value').textContent = input.value + '%'; save(); };
}
for (const key of ['smoke', 'finale', 'sound'] as const) {
  const input = $<HTMLInputElement>(key); input.checked = settings[key];
  input.onchange = async () => { settings[key] = input.checked; if (fireworks) fireworks.settings[key] = input.checked; if (key === 'sound' && input.checked) await localAudio.init(); save(); };
}
document.querySelectorAll<HTMLButtonElement>('[data-palette]').forEach(button => {
  button.setAttribute('aria-pressed', String(Number(button.dataset.palette) === settings.palette));
  button.onclick = () => { settings.palette = Number(button.dataset.palette); if (fireworks) fireworks.settings.palette = settings.palette; document.querySelectorAll('[data-palette]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); save(); fireworks?.burst(); };
});
artKaleidoscopePresets.forEach(preset => {
  const button = document.createElement('button'); button.textContent = preset.title; button.setAttribute('aria-pressed', String(preset.id === kaleidoSettings.selectedPresetId));
  button.onclick = () => {
    kaleidoSettings = { ...kaleidoSettings, ...preset.defaultParams, selectedPresetId: preset.id, petalMode: preset.petalMode, colorPalette: preset.colorPalette, materialObjects: preset.materialObjects, effects: preset.effects, thumbnailSeed: preset.thumbnailSeed, introReplayKey: kaleidoSettings.introReplayKey + 1 };
    kaleidoscope?.setSettings(kaleidoSettings);
    document.querySelectorAll('#art-presets button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    $<HTMLInputElement>('segments').value = String(kaleidoSettings.segments); $('segments-value').textContent = String(kaleidoSettings.segments);
    $<HTMLInputElement>('speed').value = String(kaleidoSettings.speed); $('speed-value').textContent = String(kaleidoSettings.speed);
  };
  $('art-presets').appendChild(button);
});
for (const key of ['segments', 'speed'] as const) $<HTMLInputElement>(key).oninput = event => { const value = Number((event.target as HTMLInputElement).value); kaleidoSettings = { ...kaleidoSettings, [key]: value }; kaleidoscope?.setSettings(kaleidoSettings); $(key + '-value').textContent = String(value); };
$<HTMLInputElement>('reactivity').oninput = event => { reactivity = Number((event.target as HTMLInputElement).value) / 100; $('reactivity-value').textContent = Math.round(reactivity * 100) + '%'; };
$('capture-button').onclick = () => {
  const canvas = host.querySelector('canvas'); if (!canvas) return;
  const link = document.createElement('a'); link.download = `Mineradio-Visual-${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click();
};
$('open-editor').onclick = () => { notify('visual-theater-open-editor'); if (!embedded) location.href = './index.html'; };
window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); localAudio.dispose(); fireworks?.dispose(); kaleidoscope?.dispose(); });
setMode(mode); setPanel(panelOpen); updateStatus(); frame = requestAnimationFrame(animate); notify('visual-theater-ready');
