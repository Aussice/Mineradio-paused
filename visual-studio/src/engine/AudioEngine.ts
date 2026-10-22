export type AudioBands = { bass: number; mid: number; high: number; energy: number };

/** Audio never leaves the device. Microphone monitoring is deliberately disconnected. */
export class AudioEngine {
  context: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private gain: GainNode | null = null;
  private effects: GainNode | null = null;
  private source: AudioBufferSourceNode | MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private buffer: AudioBuffer | null = null;
  private demo: AudioBuffer | null = null;
  private bins = new Uint8Array(1024);
  private started = 0;
  private offset = 0;
  private volume = 0.65;
  duration = 168;
  playing = false;
  mode: 'demo' | 'file' | 'mic' = 'demo';

  async init() {
    if (!this.context) {
      this.context = new AudioContext();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.72;
      this.gain = this.context.createGain();
      this.gain.gain.value = this.volume;
      this.analyser.connect(this.gain).connect(this.context.destination);
      this.effects = this.context.createGain();
      this.effects.gain.value = 0.2;
      this.effects.connect(this.context.destination);
    }
    await this.context.resume();
  }

  private makeDemo() {
    const rate = 22050;
    const buffer = this.context!.createBuffer(1, rate * 24, rate);
    const data = buffer.getChannelData(0);
    const chords = [[130.81, 164.81, 196], [110, 130.81, 164.81], [87.31, 110, 130.81], [98, 123.47, 146.83]];
    for (let i = 0; i < data.length; i++) {
      const t = i / rate;
      const chord = chords[Math.floor(t / 6) % 4];
      const chordTime = t % 6;
      const padEnvelope = Math.min(chordTime / 0.65, 1) * Math.min((6 - chordTime) / 0.8, 1);
      let sample = 0;
      for (const frequency of chord) {
        sample += (Math.sin(t * frequency * Math.PI * 2) + 0.22 * Math.sin(t * frequency * 4 * Math.PI)) * 0.038 * padEnvelope;
      }
      const beat = t % 0.5;
      sample += Math.sin(2 * Math.PI * (48 * beat + 7 * (1 - Math.exp(-beat * 30)))) * Math.exp(-beat * 18) * 0.48;
      const hat = (t + 0.25) % 0.5;
      sample += (Math.random() - 0.5) * Math.exp(-hat * 105) * 0.085;
      const noteTime = t % 0.75;
      const note = chord[Math.floor(t / 0.75) % 3] * (Math.floor(t / 3) % 2 ? 4 : 8);
      sample += (Math.sin(note * t * 2 * Math.PI) + 0.2 * Math.sin(note * t * 4 * Math.PI)) * Math.exp(-noteTime * 5) * 0.075;
      data[i] = Math.tanh(sample);
    }
    return buffer;
  }

  async play() {
    await this.init();
    if (this.playing) return;
    if (this.mode === 'mic') return;
    if (this.mode === 'demo' && !this.demo) this.demo = this.makeDemo();
    const buffer = this.mode === 'demo' ? this.demo : this.buffer;
    if (!buffer) return;
    const source = this.context!.createBufferSource();
    source.buffer = buffer;
    source.loop = this.mode === 'demo';
    source.connect(this.analyser!);
    this.started = this.context!.currentTime;
    source.start(0, this.offset % buffer.duration);
    this.source = source;
    this.playing = true;
    source.onended = () => {
      if (this.source === source) { this.playing = false; this.offset = 0; }
    };
  }

  pause() {
    if (this.playing && this.mode !== 'mic') this.offset = this.position;
    this.playing = false;
    if (this.source instanceof AudioBufferSourceNode) this.source.stop();
    this.source?.disconnect();
    this.source = null;
  }

  get position() {
    if (this.mode === 'mic') return 0;
    return Math.min(this.duration, this.offset + (this.playing && this.context ? this.context.currentTime - this.started : 0));
  }

  async seek(seconds: number) {
    if (this.mode === 'mic') return;
    const wasPlaying = this.playing;
    this.pause();
    this.offset = Math.max(0, Math.min(seconds, this.duration - 0.01));
    if (wasPlaying) await this.play();
  }

  async load(file: File) {
    await this.init();
    const decoded = await this.context!.decodeAudioData(await file.arrayBuffer());
    this.stopMic();
    this.pause();
    this.buffer = decoded;
    this.mode = 'file';
    this.duration = decoded.duration;
    this.offset = 0;
    await this.play();
  }

  async useDemo() {
    this.stopMic();
    this.pause();
    this.mode = 'demo';
    this.duration = 168;
    this.offset = 0;
    await this.play();
  }

  async microphone() {
    await this.init();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false } });
    this.pause();
    this.stopMic();
    this.stream = stream;
    this.mode = 'mic';
    // Separate analyser prevents feedback through the speaker chain.
    const analyser = this.context!.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.72;
    this.analyser = analyser;
    this.source = this.context!.createMediaStreamSource(stream);
    this.source.connect(analyser);
    this.playing = true;
  }

  stopMic() {
    if (!this.stream) return;
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.source?.disconnect();
    this.source = null;
    this.playing = false;
    this.mode = this.buffer ? 'file' : 'demo';
    this.duration = this.buffer?.duration ?? 168;
    if (this.context && this.gain) {
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.72;
      this.analyser.connect(this.gain);
    }
  }

  setVolume(value: number) {
    this.volume = value;
    if (this.gain && this.context) this.gain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
  }

  read(): AudioBands {
    if (!this.analyser || !this.playing || !this.context) return { bass: 0, mid: 0, high: 0, energy: 0 };
    this.analyser.getByteFrequencyData(this.bins);
    const average = (low: number, high: number) => {
      const hzPerBin = this.context!.sampleRate / 2048;
      const start = Math.max(1, Math.floor(low / hzPerBin));
      const end = Math.min(this.bins.length - 1, Math.ceil(high / hzPerBin));
      let total = 0;
      for (let i = start; i <= end; i++) total += this.bins[i];
      return total / (end - start + 1) / 255;
    };
    const bass = average(35, 180);
    const mid = average(220, 2200);
    const high = average(2500, 12000);
    return { bass, mid, high, energy: bass * 0.45 + mid * 0.35 + high * 0.2 };
  }

  boom(distance = 160, strength = 1) {
    if (!this.context || !this.effects || this.context.state !== 'running') return;
    const ctx = this.context;
    const at = ctx.currentTime + distance / 343;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / ctx.sampleRate * 6);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 380;
    const gain = ctx.createGain(); gain.gain.value = Math.min(1, strength) * 0.6;
    noise.connect(filter).connect(gain).connect(this.effects);
    noise.start(at);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
  }

  dispose() { this.stopMic(); this.pause(); void this.context?.close(); }
}
