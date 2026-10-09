const CoreRequire = require('./CoreRequire');
const PitchEstimator = require('./PitchEstimator');

const WavCodec = CoreRequire.load('shared/audio/WavCodec');
const PcmSamples = CoreRequire.load('shared/audio/PcmSamples');

class VoicePreview {
  static DEFAULT_TEXT = 'Hi, this is how I sound. Pretty close, right?';
  static MAX_TEXT = 300;
  static DEFAULT_RATE = 24000;

  constructor({ engine, store, voiceId, text }) {
    this._engine = engine;
    this._store = store;
    this._voiceId = String(voiceId || '');
    this._text = String(text || VoicePreview.DEFAULT_TEXT).slice(0, VoicePreview.MAX_TEXT);
  }

  static render(options) {
    return new VoicePreview(options).execute();
  }

  async execute() {
    this._requireReady();
    const t0 = Date.now();
    const { samples, sampleRate } = await this._synthesize();
    const row = this._store.get(this._voiceId);
    return {
      wavBase64: WavCodec.encode(samples, sampleRate).toString('base64'),
      ms: Date.now() - t0,
      seconds: samples.length / sampleRate,
      hz: PitchEstimator.medianF0(samples, sampleRate).medianHz,
      refHz: row ? row.refHz || null : null,
    };
  }

  _requireReady() {
    const ready = this._engine.isReady(this._voiceId);
    if (!ready.ready) throw Object.assign(new Error(ready.error), { code: ready.code });
  }

  async _synthesize() {
    const parts = [];
    let sampleRate = VoicePreview.DEFAULT_RATE;
    const handle = this._engine.synthesize({ voiceId: this._voiceId, text: this._text, speed: 1 }, (c) => {
      sampleRate = c.sampleRate || sampleRate;
      parts.push(PcmSamples.int16BytesToFloat(c.pcm));
    });
    await handle.done;
    return { samples: VoicePreview._concat(parts), sampleRate };
  }

  static _concat(parts) {
    const all = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
    let off = 0;
    for (const p of parts) { all.set(p, off); off += p.length; }
    return all;
  }
}

module.exports = VoicePreview;
