const SherpaAddon = require('../../tts-server/runtimes/SherpaAddon');
const WavCodec = require('../../shared/audio/WavCodec');

class SherpaSttWorkerSession {
  constructor({ post, exit, loadAddon = SherpaAddon.load } = {}) {
    this._post = post;
    this._exit = exit;
    this._loadAddon = loadAddon;
    this._recognizer = null;
    this._queue = [];
    this._busy = false;
  }

  handle(message) {
    if (!message || typeof message.type !== 'string') return;
    if (message.type === 'init') this._init(message.config);
    else if (message.type === 'transcribe') this._enqueue(message);
    else if (message.type === 'shutdown') this._exit(0);
  }

  async _init(config) {
    try {
      const sherpa = this._loadAddon(config.addonDir);
      this._recognizer = await SherpaAddon.create(sherpa.OfflineRecognizer, config.recognizerConfig);
      this._post({ type: 'ready' });
      this._pump();
    } catch (err) {
      this._post({ type: 'init-error', message: SherpaAddon.errorMessage(err) });
    }
  }

  _enqueue(message) {
    this._queue.push(message);
    this._pump();
  }

  _pump() {
    if (this._busy || !this._recognizer || this._queue.length === 0) return;
    const request = this._queue.shift();
    this._busy = true;
    this._runOne(request)
      .catch((err) => this._post({ type: 'error', id: request.id, message: SherpaAddon.errorMessage(err) }))
      .finally(() => {
        this._busy = false;
        this._pump();
      });
  }

  async _runOne(request) {
    const startedAt = Date.now();
    const { samples, sampleRate } = WavCodec.parse(request.wav);
    if (!samples.length) throw new Error('transcribe: empty audio');
    const result = await this._decode(this._openStream(request.language, samples, sampleRate));
    this._post({
      type: 'result',
      id: request.id,
      text: SherpaSttWorkerSession.cleanText(result && result.text),
      lang: (result && result.lang) || '',
      durationMs: Date.now() - startedAt,
      audioSec: samples.length / sampleRate,
    });
  }

  _openStream(language, samples, sampleRate) {
    const stream = this._recognizer.createStream();
    SherpaSttWorkerSession._applyLanguageHint(stream, language);
    stream.acceptWaveform({ sampleRate, samples });
    return stream;
  }

  async _decode(stream) {
    if (typeof this._recognizer.decodeAsync === 'function') return this._recognizer.decodeAsync(stream);
    this._recognizer.decode(stream);
    return this._recognizer.getResult(stream);
  }

  static cleanText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  static _applyLanguageHint(stream, language) {
    const lang = String(language || '').toLowerCase();
    if (!lang || lang === 'auto' || typeof stream.setOption !== 'function') return;
    try {
      stream.setOption('language', lang);
    } catch (_) {}
  }
}

module.exports = SherpaSttWorkerSession;
