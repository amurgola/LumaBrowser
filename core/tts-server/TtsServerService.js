const os = require('os');
const path = require('path');
const AppPaths = require('../shared/AppPaths');
const IdleTimer = require('../shared/runtime/server/IdleTimer');
const SherpaRuntimeLayout = require('./runtimes/SherpaRuntimeLayout');
const SherpaWorkerEnv = require('./runtimes/SherpaWorkerEnv');
const SherpaWorkerProcess = require('./runtimes/SherpaWorkerProcess');
const TtsModelsScanner = require('./TtsModelsScanner');
const TtsModelCatalog = require('./models/TtsModelCatalog');
const TtsModelConfigBuilder = require('./models/TtsModelConfigBuilder');
const KokoroTokenPatcher = require('./models/KokoroTokenPatcher');
const TtsEngineRegistry = require('./TtsEngineRegistry');
const TtsVoiceSettings = require('./TtsVoiceSettings');
const TtsExternalVoices = require('./TtsExternalVoices');
const TtsModelInstaller = require('./TtsModelInstaller');
const PendingSyntheses = require('./PendingSyntheses');

class TtsServerService {
  static READY_TIMEOUT_MS = 120 * 1000;
  static WORKER_FILE = 'TtsWorker.js';
  static MIN_THREADS = 4;
  static MAX_THREADS = 12;

  constructor(settingsDb, { engines = TtsEngineRegistry.shared, fork = null } = {}) {
    this._settings = new TtsVoiceSettings(settingsDb);
    this._catalog = new TtsModelCatalog();
    this._scanner = new TtsModelsScanner();
    this._external = new TtsExternalVoices(engines);
    this._installer = new TtsModelInstaller({ catalog: this._catalog, modelsDir: () => this.getModelsDir() });
    this._requests = new PendingSyntheses();
    this._worker = this._createWorker(fork);
    this._workerInfo = null;
    this._requestCounter = 0;
    this._ensureChain = Promise.resolve();
    this._idle = new IdleTimer(() => this._onIdle());
  }

  static threadCount(cpuCount = os.cpus().length) {
    const half = Math.floor(cpuCount / 2);
    return Math.min(TtsServerService.MAX_THREADS, Math.max(TtsServerService.MIN_THREADS, half));
  }

  getRuntimesDir() { return path.join(AppPaths.appBaseDir(), 'runtimes'); }
  getModelsDir() { return path.join(AppPaths.appBaseDir(), 'models', 'tts'); }

  getDefaultModelId() { return this._settings.getModelId(); }
  setDefaultModelId(id) { this._settings.setModelId(id); }
  getSid() { return this._settings.getSid(); }
  setSid(sid) { this._settings.setSid(sid); }
  getSpeed() { return this._settings.getSpeed(); }
  setSpeed(speed) { this._settings.setSpeed(speed); }
  getAutoUnloadMs() { return this._settings.getAutoUnloadMs(); }

  get workerState() { return this._worker.state; }
  get workerInfo() { return this._workerInfo; }
  get lastError() { return this._worker.lastError; }

  resolveModel() {
    return this._resolveFrom(this._scanModels());
  }

  getView() {
    const scanned = this._scanModels();
    const model = this._resolveFrom(scanned);
    const external = this._external.catalogRows();
    return {
      ...this._runtimeView(),
      models: scanned.concat(external.map((entry) => TtsExternalVoices.modelRow(entry))),
      modelCatalog: this._catalog.list().concat(external),
      recommendedModelId: this._catalog.recommendedId(TtsServerService.threadCount()),
      defaultModelId: model ? model.id : null,
      sid: this.getSid(),
      speed: this.getSpeed(),
      workerState: this.workerState,
      workerInfo: this.workerInfo,
      lastError: this.lastError,
    };
  }

  ensureRunning() {
    this._ensureChain = this._ensureChain.catch(() => {}).then(() => this._ensure());
    return this._ensureChain;
  }

  synthesize(args, onChunk) {
    const id = `tts-${++this._requestCounter}`;
    const done = this._runSynthesis(id, args || {}, onChunk);
    return { id, done };
  }

  cancel(id) {
    if (this._external.cancel(id)) return;
    this._worker.tryPost({ type: 'cancel', id });
    if (this._requests.resolve(id, { canceled: true })) this._armIdle();
  }

  async stop() {
    this._idle.disarm();
    await this._stopWorker();
    await this._external.stopAll();
  }

  async downloadModel(catalogId, onEvent) {
    const result = await this._installer.install(catalogId, onEvent);
    if (result && result.success) this.setDefaultModelId(result.modelId);
    return result;
  }

  cancelDownload() {
    return this._installer.cancel();
  }

  _createWorker(fork) {
    return new SherpaWorkerProcess({
      workerPath: path.join(__dirname, TtsServerService.WORKER_FILE),
      serviceName: 'luma-tts-worker',
      label: 'TTS',
      readyTimeoutMs: TtsServerService.READY_TIMEOUT_MS,
      onMessage: (message) => this._onWorkerMessage(message),
      onExit: (err) => this._onWorkerExit(err),
      onStderr: (text) => console.warn('[tts-worker]', text),
      fork,
    });
  }

  _scanModels() {
    return this._scanner.scan(this.getModelsDir());
  }

  _resolveFrom(scanned) {
    const chosen = this.getDefaultModelId();
    const external = this._external.describe(chosen);
    if (external) return external;
    if (!scanned.length) return null;
    return scanned.find((model) => model.id === chosen) || scanned[0];
  }

  _runtimeView() {
    const root = this.getRuntimesDir();
    const runtimeVersion = SherpaRuntimeLayout.installedVersion(root);
    const runtimeReady = SherpaRuntimeLayout.isInstalled(root);
    return {
      runtimeReady,
      runtimeVersion,
      runtimeOutdated: !!(runtimeReady && runtimeVersion && runtimeVersion !== SherpaRuntimeLayout.VERSION),
      runtimePinnedVersion: SherpaRuntimeLayout.VERSION,
      platformSupported: !!SherpaRuntimeLayout.platformPackageName(),
    };
  }

  async _ensure() {
    const model = this._modelOrThrow();
    if (model.external) return this._external.prewarm(model);
    this._assertRuntimeInstalled();
    if (this._isLoaded(model)) {
      this._armIdle();
      return this._workerInfo;
    }
    await this._stopWorker();
    return this._startWorker(model);
  }

  _modelOrThrow() {
    const model = this.resolveModel();
    if (model) return model;
    const err = new Error('No voice installed. Download one in the voice setup.');
    err.code = 'NO_TTS_MODEL';
    throw err;
  }

  _assertRuntimeInstalled() {
    if (SherpaRuntimeLayout.isInstalled(this.getRuntimesDir())) return;
    const err = new Error('The text-to-speech runtime is not installed yet.');
    err.code = 'TTS_RUNTIME_MISSING';
    err.installable = true;
    throw err;
  }

  _isLoaded(model) {
    return this.workerState === 'ready' && this._workerInfo && this._workerInfo.modelId === model.id;
  }

  async _startWorker(model) {
    const ready = await this._worker.start({
      env: SherpaWorkerEnv.build(SherpaRuntimeLayout.platformDir(this.getRuntimesDir())),
      initConfig: this._initConfig(model),
      timeoutMessage: 'The voice model did not load within 120s.',
    });
    this._workerInfo = { numSpeakers: ready.numSpeakers, sampleRate: ready.sampleRate, modelId: model.id, engine: model.engine };
    this._armIdle();
    return this._workerInfo;
  }

  _initConfig(model) {
    if (model.engine === 'kokoro') {
      try { KokoroTokenPatcher.patch(model.dir); } catch (_) {}
    }
    const config = {
      addonDir: SherpaRuntimeLayout.addonDir(this.getRuntimesDir()),
      modelConfig: TtsModelConfigBuilder.build(model, model.dir, TtsServerService.threadCount()),
    };
    if (model.engine === 'pocket') config.pocket = TtsServerService._pocketConfig(model);
    return config;
  }

  static _pocketConfig(model) {
    return {
      voices: (model.voices || []).map((voice) => ({ id: voice.id, name: voice.name, path: voice.path })),
      numSteps: TtsModelCatalog.POCKET_NUM_STEPS,
    };
  }

  async _stopWorker() {
    this._workerInfo = null;
    await this._worker.stop();
  }

  _onWorkerMessage(message) {
    if (message.type === 'chunk') {
      this._requests.chunk(message.id, { seq: message.seq, sampleRate: message.sampleRate, pcm: message.pcm });
    } else if (message.type === 'done') {
      if (this._requests.resolve(message.id, { canceled: !!message.canceled })) this._armIdle();
    } else if (message.type === 'error') {
      if (this._requests.reject(message.id, new Error(message.message || 'synthesis failed'))) this._armIdle();
    }
  }

  _onWorkerExit(err) {
    if (!this._worker.running) this._workerInfo = null;
    this._requests.rejectAll(err);
  }

  async _runSynthesis(id, args, onChunk) {
    const info = await this.ensureRunning();
    const speed = Number(args.speed) > 0 ? Number(args.speed) : this.getSpeed();
    const text = String(args.text || '');
    if (info && info.external) return this._external.synthesize(id, info.modelId, { text, speed }, onChunk);
    const sid = Number.isFinite(args.sid) ? Number(args.sid) : this.getSid();
    return this._sendToWorker(id, { type: 'synthesize', id, text, sid, speed }, onChunk);
  }

  _sendToWorker(id, message, onChunk) {
    this._idle.disarm();
    return new Promise((resolve, reject) => {
      this._requests.add(id, { onChunk, resolve, reject });
      try {
        this._worker.post(message);
      } catch (err) {
        this._requests.reject(id, err);
      }
    });
  }

  _onIdle() {
    if (this._requests.size === 0) this.stop().catch(() => {});
  }

  _armIdle() {
    this._idle.set(this.getAutoUnloadMs());
    if (this._requests.size > 0) this._idle.disarm();
    else this._idle.arm();
  }
}

module.exports = TtsServerService;
