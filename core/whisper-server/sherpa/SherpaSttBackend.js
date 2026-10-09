const os = require('os');
const path = require('path');
const IdleTimer = require('../../shared/runtime/server/IdleTimer');
const SherpaRuntimeLayout = require('../../tts-server/runtimes/SherpaRuntimeLayout');
const SherpaWorkerEnv = require('../../tts-server/runtimes/SherpaWorkerEnv');
const SherpaWorkerProcess = require('../../tts-server/runtimes/SherpaWorkerProcess');
const SttRecognizerConfigBuilder = require('../models/SttRecognizerConfigBuilder');
const PendingTranscriptions = require('./PendingTranscriptions');

class SherpaSttBackend {
  static READY_TIMEOUT_MS = 120 * 1000;
  static TRANSCRIBE_TIMEOUT_MS = 60 * 1000;
  static STOP_GRACE_MS = SherpaWorkerProcess.STOP_GRACE_MS;
  static WORKER_FILE = 'SherpaSttWorker.js';
  static MIN_THREADS = 2;
  static MAX_THREADS = 8;

  constructor({ runtimesDir, fork = null }) {
    this._runtimesDir = runtimesDir;
    this._worker = this._createWorker(fork);
    this._info = null;
    this._pending = new PendingTranscriptions();
    this._ensureChain = Promise.resolve();
    this._idleMs = 0;
    this._idle = new IdleTimer(() => this._onIdle());
  }

  get state() {
    return this._worker.state;
  }

  isRuntimeInstalled() {
    return SherpaRuntimeLayout.isInstalled(this._runtimesDir());
  }

  setIdleTimeout(ms) {
    this._idleMs = Number(ms) || 0;
    this._idle.set(this._idleMs);
    if (this.state === 'ready' && this._pending.size === 0) this._idle.arm();
  }

  markActive() {
    this._armIdle();
  }

  getStatus() {
    return {
      state: this.state,
      modelId: this._info ? this._info.modelId : null,
      lastError: this._worker.lastError,
      engine: 'sherpa',
    };
  }

  ensureRunning(model) {
    this._ensureChain = this._ensureChain.catch(() => {}).then(() => this._ensure(model));
    return this._ensureChain;
  }

  transcribe(wav, { language } = {}) {
    if (this.state !== 'ready' || !this._worker.running) {
      return Promise.reject(new Error('SherpaSttBackend: worker is not ready (call ensureRunning first)'));
    }
    this._idle.disarm();
    return new Promise((resolve, reject) => this._sendTranscribe(wav, language, resolve, reject));
  }

  async stop() {
    this._idle.disarm();
    await this._stopWorker();
  }

  static threadCount(cpuCount = os.cpus().length) {
    const half = Math.floor(cpuCount / 2);
    return Math.min(SherpaSttBackend.MAX_THREADS, Math.max(SherpaSttBackend.MIN_THREADS, half));
  }

  _createWorker(fork) {
    return new SherpaWorkerProcess({
      workerPath: path.join(__dirname, SherpaSttBackend.WORKER_FILE),
      serviceName: 'luma-stt-worker',
      label: 'STT',
      readyTimeoutMs: SherpaSttBackend.READY_TIMEOUT_MS,
      onMessage: (message) => this._onMessage(message),
      onExit: (err) => this._onWorkerExit(err),
      onStderr: (text) => SherpaSttBackend._logStderr(text),
      fork,
    });
  }

  async _ensure(model) {
    this._assertSherpaModel(model);
    this._assertRuntimeInstalled();
    if (this._isRunning(model)) {
      this._armIdle();
      return this.getStatus();
    }
    await this._stopWorker();
    return this._startWorker(model);
  }

  _assertSherpaModel(model) {
    if (!model || model.engine !== 'sherpa') throw new Error('SherpaSttBackend: a sherpa model descriptor is required');
  }

  _assertRuntimeInstalled() {
    if (this.isRuntimeInstalled()) return;
    const err = new Error('The speech engine (sherpa-onnx) is not installed yet.');
    err.code = 'STT_RUNTIME_MISSING';
    err.installable = true;
    throw err;
  }

  _isRunning(model) {
    return this.state === 'ready' && this._info && this._info.modelId === model.id;
  }

  async _startWorker(model) {
    await this._worker.start({
      env: SherpaWorkerEnv.build(SherpaRuntimeLayout.platformDir(this._runtimesDir())),
      initConfig: this._initConfig(model),
      timeoutMessage: 'The speech recognition model did not load within 120s.',
    });
    this._info = { modelId: model.id, sherpaKind: model.sherpaKind };
    this._armIdle();
    return this.getStatus();
  }

  _initConfig(model) {
    const addonDir = SherpaRuntimeLayout.addonDir(this._runtimesDir());
    const recognizerConfig = SttRecognizerConfigBuilder.build(model, model.dir, SherpaSttBackend.threadCount());
    return { addonDir, recognizerConfig };
  }

  static _logStderr(text) {
    if (!/resampler|sample_rate/i.test(text)) console.warn('[stt-worker]', text);
  }

  _onWorkerExit(err) {
    if (!this._worker.running) this._info = null;
    this._pending.rejectAll(err);
  }

  _onMessage(message) {
    if (message.type === 'result') this._settle(this._pending.resolve(message.id, SherpaSttBackend._resultOf(message)));
    else if (message.type === 'error') this._settle(this._pending.reject(message.id, new Error(message.message || 'transcription failed')));
  }

  _settle(found) {
    if (found) this._armIdle();
  }

  static _resultOf(message) {
    return { text: message.text, lang: message.lang, durationMs: message.durationMs, audioSec: message.audioSec };
  }

  _sendTranscribe(wav, language, resolve, reject) {
    const id = this._pending.nextId();
    const bytes = wav instanceof Uint8Array ? wav : new Uint8Array(wav);
    this._pending.add(id, { resolve, reject, timeoutMs: SherpaSttBackend.TRANSCRIBE_TIMEOUT_MS, onTimeout: () => this._armIdle() });
    try {
      this._worker.post({ type: 'transcribe', id, wav: bytes, language: language || '' });
    } catch (err) {
      this._pending.reject(id, err);
    }
  }

  async _stopWorker() {
    this._info = null;
    await this._worker.stop();
  }

  _onIdle() {
    if (this._pending.size === 0) this.stop().catch(() => {});
  }

  _armIdle() {
    this._idle.set(this._idleMs);
    if (this._pending.size > 0) this._idle.disarm();
    else this._idle.arm();
  }
}

module.exports = SherpaSttBackend;
