const SherpaAddon = require('../runtimes/SherpaAddon');
const PcmSamples = require('../../shared/audio/PcmSamples');
const PocketVoices = require('./PocketVoices');
const TtsSynthesisRequest = require('./TtsSynthesisRequest');

class TtsWorkerSession {
  constructor({ post, exit, loadAddon = SherpaAddon.load, readFile, warn } = {}) {
    this._post = post;
    this._exit = exit;
    this._loadAddon = loadAddon;
    this._voiceIo = { readFile, warn };
    this._tts = null;
    this._pocket = null;
    this._queue = [];
    this._canceled = new Set();
    this._busy = false;
  }

  handle(message) {
    if (!message || typeof message.type !== 'string') return;
    if (message.type === 'init') this._init(message.config);
    else if (message.type === 'synthesize') this._enqueue(message);
    else if (message.type === 'cancel') this._cancel(message.id);
    else if (message.type === 'shutdown') this._exit(0);
  }

  async _init(config) {
    try {
      await this._loadEngine(config);
      this._post({ type: 'ready', numSpeakers: this._numSpeakers(), sampleRate: this._tts.sampleRate });
      this._pump();
    } catch (err) {
      this._post({ type: 'init-error', message: SherpaAddon.errorMessage(err) });
    }
  }

  async _loadEngine(config) {
    const sherpa = this._loadAddon(config.addonDir);
    if (config.pocket) this._pocket = PocketVoices.load(config.pocket, this._voiceIo);
    this._tts = await SherpaAddon.create(sherpa.OfflineTts, config.modelConfig);
  }

  _numSpeakers() {
    return this._pocket ? this._pocket.count : this._tts.numSpeakers;
  }

  _enqueue(message) {
    this._queue.push(message);
    this._pump();
  }

  _cancel(id) {
    this._canceled.add(id);
    this._queue = this._queue.filter((queued) => queued.id !== id);
  }

  _pump() {
    if (this._busy || !this._tts || this._queue.length === 0) return;
    const request = this._queue.shift();
    if (this._canceled.delete(request.id)) {
      this._post({ type: 'done', id: request.id, canceled: true });
      this._pump();
      return;
    }
    this._busy = true;
    this._runOne(request)
      .catch((err) => this._post({ type: 'error', id: request.id, message: SherpaAddon.errorMessage(err) }))
      .finally(() => {
        this._busy = false;
        this._pump();
      });
  }

  async _runOne(message) {
    const run = { id: message.id, seq: 0, sawChunks: false };
    const audio = await this._generate(TtsSynthesisRequest.build(message, this._pocket), run);
    const wasCanceled = this._canceled.delete(message.id);
    if (!run.sawChunks && !wasCanceled && audio && audio.samples && audio.samples.length) {
      this._postChunk(run, audio.samples, audio.sampleRate || this._tts.sampleRate);
    }
    this._post({ type: 'done', id: message.id, canceled: wasCanceled });
  }

  async _generate(request, run) {
    if (typeof this._tts.generateAsync !== 'function') return this._tts.generate({ ...request, enableExternalBuffer: false });
    const onProgress = (info) => this._onProgress(run, info);
    return this._tts.generateAsync({ ...request, enableExternalBuffer: false, onProgress });
  }

  _onProgress(run, info) {
    if (this._canceled.has(run.id)) return 0;
    if (info && info.samples && info.samples.length) {
      run.sawChunks = true;
      this._postChunk(run, info.samples, this._tts.sampleRate);
    }
    return 1;
  }

  _postChunk(run, samples, sampleRate) {
    this._post({ type: 'chunk', id: run.id, seq: run.seq++, sampleRate, pcm: PcmSamples.floatToInt16Bytes(samples) });
  }
}

module.exports = TtsWorkerSession;
