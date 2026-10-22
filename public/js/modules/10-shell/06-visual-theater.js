// The native player owns music, queues and accounts. This frame owns visuals only.
(function () {
  'use strict';
  var frame = null;
  var currentMode = 'native';
  var ready = false;
  var controlsOpen = false;
  var lastAudioAt = 0;
  var editor = null;
  var shell = document.querySelector('.desktop-window-controls');
  if (!shell) return;
  var toolbar = document.createElement('div');
  toolbar.className = 'visual-theater-toolbar';
  toolbar.innerHTML = '<select id="visual-theater-select" aria-label="视觉舞台"><option value="native">原生舞台</option><option value="fireworks">音乐烟花</option><option value="kaleidoscope">万花筒</option></select><button id="visual-theater-controls" type="button" aria-label="打开视觉控制台" aria-pressed="false" title="视觉控制台">视觉控制</button>';
  shell.insertBefore(toolbar, shell.firstChild);
  if (!window.desktopWindow) { toolbar.classList.add('visual-theater-web-toolbar'); document.body.appendChild(toolbar); }
  var selector = document.getElementById('visual-theater-select');
  var controlButton = document.getElementById('visual-theater-controls');
  // Production runs on the local HTTP server. Upstream file-based QA tests
  // exercise its native renderer and should not launch an HTTP-only frame.
  if (location.protocol !== 'http:' && location.protocol !== 'https:') { toolbar.hidden = true; return; }
  function send(type, payload) {
    if (frame && ready) frame.contentWindow.postMessage(Object.assign({ type: type }, payload || {}), location.origin);
  }
  function setControls(open) {
    controlsOpen = !!open && currentMode !== 'native';
    document.body.classList.toggle('visual-theater-panel-open', controlsOpen);
    controlButton.setAttribute('aria-pressed', String(controlsOpen));
    send('visual-theater-controls', { open: controlsOpen });
  }
  function closeEditor() {
    if (editor) editor.remove();
    editor = null;
  }
  function select(mode) {
    if (['native', 'fireworks', 'kaleidoscope'].indexOf(mode) < 0) return;
    closeEditor(); currentMode = mode; selector.value = mode;
    document.body.classList.toggle('visual-theater-active', mode !== 'native');
    controlButton.disabled = mode === 'native';
    localStorage.setItem('mineradio-visual-theater-mode', mode);
    if (mode === 'native') {
      setControls(false); ready = false;
      if (frame) frame.remove(); frame = null;
      return;
    }
    if (window.MineradioSonicTopography) MineradioSonicTopography.clear();
    if (window.MineradioSonicWorkshop) MineradioSonicWorkshop.clear();
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'visual-theater-frame'; frame.title = '音乐视觉舞台';
      frame.setAttribute('allow', 'microphone');
      frame.src = '/visual-studio/stage.html?mode=' + mode;
      document.body.appendChild(frame);
    } else send('visual-theater-mode', { mode: mode });
  }
  selector.addEventListener('change', function () { select(selector.value); });
  controlButton.addEventListener('click', function () { setControls(!controlsOpen); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { closeEditor(); setControls(false); }
  });
  document.addEventListener('pointerdown', function (event) {
    if (currentMode !== 'fireworks' || controlsOpen || event.button !== 0) return;
    if (event.target.closest && event.target.closest('button,input,select,a,[role="dialog"],#search-area,#bottom-bar,#playlist-panel,#fx-panel,#empty-home,#splash')) return;
    send('visual-theater-launch', { x: event.clientX / innerWidth, y: event.clientY / innerHeight, halo: event.shiftKey });
  });
  async function pausePlayer() {
    if (typeof playing !== 'undefined' && playing && typeof togglePlay === 'function') await togglePlay();
    return typeof audio === 'undefined' || !audio || audio.paused;
  }
  window.addEventListener('message', async function (event) {
    if (event.origin !== location.origin || !frame || event.source !== frame.contentWindow || !event.data) return;
    var data = event.data;
    if (data.type === 'visual-theater-ready') {
      ready = true; send('visual-theater-mode', { mode: currentMode }); setControls(controlsOpen);
    }
    if (data.type === 'visual-theater-panel-state') {
      controlsOpen = data.open === true;
      document.body.classList.toggle('visual-theater-panel-open', controlsOpen);
      controlButton.setAttribute('aria-pressed', String(controlsOpen));
    }
    if (data.type === 'visual-theater-error') { select('native'); if (typeof showToast === 'function') showToast('视觉舞台加载失败，已恢复原生舞台'); }
    if (data.type === 'visual-theater-play-demo-request') {
      var paused = await pausePlayer();
      send('visual-theater-demo-ready', { allowed: paused });
    }
    if (data.type === 'visual-theater-microphone-request') {
      var allowed = await pausePlayer();
      try {
        if (allowed && window.desktopWindow && typeof desktopWindow.requestVisualMicrophonePermission === 'function') {
          var permission = await desktopWindow.requestVisualMicrophonePermission(); allowed = permission && permission.ok === true;
        }
      } catch (_) { allowed = false; }
      send('visual-theater-microphone-ready', { allowed: allowed });
    }
    if (data.type === 'visual-theater-open-editor') {
      closeEditor(); editor = document.createElement('section'); editor.id = 'visual-theater-editor';
      var close = document.createElement('button'); close.type = 'button'; close.textContent = '返回播放器 ×'; close.onclick = closeEditor;
      var editorFrame = document.createElement('iframe'); editorFrame.title = '完整万花筒工作室'; editorFrame.src = '/visual-studio/index.html';
      editor.appendChild(editorFrame); editor.appendChild(close); document.body.appendChild(editor);
    }
  });
  function average(data, sampleRate, fft, low, high) {
    var start = Math.max(1, Math.floor(low * fft / sampleRate));
    var end = Math.min(data.length - 1, Math.ceil(high * fft / sampleRate));
    var total = 0;
    for (var i = start; i <= end; i++) total += data[i];
    return Math.max(0, Math.min(1, total / Math.max(1, end - start + 1) / 255));
  }
  window.MineradioVisualTheater = {
    select: select,
    isActive: function () { return currentMode !== 'native'; },
    getMode: function () { return currentMode; },
    update: function (state) {
      if (!ready || currentMode === 'native' || performance.now() - lastAudioAt < 30) return;
      lastAudioAt = performance.now();
      var data = state.frequencies;
      var sr = state.sampleRate || 44100, fft = state.fftSize || 2048;
      send('visual-theater-audio', {
        bass: state.playing && data ? average(data, sr, fft, 35, 180) : 0,
        mid: state.playing && data ? average(data, sr, fft, 220, 2200) : 0,
        high: state.playing && data ? average(data, sr, fft, 2500, 12000) : 0,
        energy: state.playing ? Math.min(1, Math.max(0, state.energy || 0)) : 0,
        playing: state.playing === true
      });
    }
  };
  var storedMode = localStorage.getItem('mineradio-visual-theater-mode') || 'fireworks';
  select(['native', 'fireworks', 'kaleidoscope'].indexOf(storedMode) >= 0 ? storedMode : 'fireworks');
})();
