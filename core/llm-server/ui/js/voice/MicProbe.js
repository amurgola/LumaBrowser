import MicPreference from './MicPreference.js';
import WavEncoder from './WavEncoder.js';

export default class MicProbe {
  static FFT_SIZE = 1024;
  static METER_SCALE = 700;

  constructor(AudioContextClass = null) {
    this._AudioContext = AudioContextClass;
    this._probe = null;
  }

  async start(deviceId, getFill) {
    this.stop();
    const stream = await MicPreference.openStream(deviceId);
    const AudioContextClass = this._AudioContext || window.AudioContext;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const analyser = ctx.createAnalyser();
    analyser.fftSize = MicProbe.FFT_SIZE;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const mine = { stream, ctx, raf: 0 };
    this._probe = mine;
    this._tick(mine, analyser, new Float32Array(analyser.fftSize), getFill);
  }

  stop() {
    const probe = this._probe;
    if (!probe) return;
    cancelAnimationFrame(probe.raf);
    try { probe.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
    try { probe.ctx.close(); } catch (_) {}
    this._probe = null;
  }

  _tick(mine, analyser, data, getFill) {
    if (this._probe !== mine) return;
    const fill = getFill();
    if (fill) {
      analyser.getFloatTimeDomainData(data);
      fill.style.width = Math.min(100, Math.round(WavEncoder.rms(data) * MicProbe.METER_SCALE)) + '%';
    }
    mine.raf = requestAnimationFrame(() => this._tick(mine, analyser, data, getFill));
  }
}
