import MicPreference from './MicPreference.js';
import VoiceActivityDetector from './VoiceActivityDetector.js';

export default class MicCapture {
  static SAMPLE_RATE = 16000;

  constructor(AudioContextClass = null) {
    this._AudioContext = AudioContextClass;
    this._media = null;
  }

  get sampleRate() {
    return this._media && this._media.ctx ? this._media.ctx.sampleRate : MicCapture.SAMPLE_RATE;
  }

  get active() {
    return !!this._media;
  }

  async start(onFrame) {
    const stream = await MicPreference.openStream();
    const AudioContextClass = this._AudioContext || window.AudioContext;
    const ctx = new AudioContextClass({ sampleRate: MicCapture.SAMPLE_RATE });
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const source = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(VoiceActivityDetector.FRAME_SAMPLES, 1, 1);
    source.connect(proc);
    const sink = ctx.createGain();
    sink.gain.value = 0;
    proc.connect(sink);
    sink.connect(ctx.destination);
    this._media = { stream, ctx, source, proc, sink };
    proc.onaudioprocess = (e) => onFrame(e.inputBuffer.getChannelData(0));
  }

  stop() {
    const media = this._media;
    if (!media) return;
    try { media.proc.onaudioprocess = null; } catch (_) {}
    try { media.proc.disconnect(); media.source.disconnect(); media.sink.disconnect(); } catch (_) {}
    try { media.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
    try { media.ctx.close(); } catch (_) {}
    this._media = null;
  }
}
