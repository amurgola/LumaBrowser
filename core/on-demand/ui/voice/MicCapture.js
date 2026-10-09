import UtteranceDetector from './UtteranceDetector.js';

export default class MicCapture {
  constructor(win) {
    this._win = win;
    this._media = null;
  }

  get sampleRate() {
    return this._media && this._media.ctx ? this._media.ctx.sampleRate : UtteranceDetector.SAMPLE_RATE;
  }

  async open(onFrame) {
    const stream = await this._win.navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const ctx = new this._win.AudioContext({ sampleRate: UtteranceDetector.SAMPLE_RATE });
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const source = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(UtteranceDetector.FRAME, 1, 1);
    source.connect(proc);
    const sink = ctx.createGain();
    sink.gain.value = 0;
    proc.connect(sink);
    sink.connect(ctx.destination);
    this._media = { stream, ctx, proc };
    proc.onaudioprocess = (e) => onFrame(e.inputBuffer.getChannelData(0));
  }

  close() {
    if (!this._media) return;
    const { stream, ctx, proc } = this._media;
    try { proc.onaudioprocess = null; } catch (_) {}
    try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
    try { ctx.close(); } catch (_) {}
    this._media = null;
  }
}
