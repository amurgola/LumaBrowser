const path = require('path');
const AppPaths = require('../shared/AppPaths');
const WhisperRuntimeServer = require('./server/WhisperRuntimeServer');
const WhisperServerLauncher = require('./server/WhisperServerLauncher');
const SherpaSttBackend = require('./sherpa/SherpaSttBackend');
const SttModelCatalog = require('./models/SttModelCatalog');
const SttSettings = require('./service/SttSettings');
const SttModelLibrary = require('./service/SttModelLibrary');
const SttRuntimeView = require('./service/SttRuntimeView');
const SttModelInstaller = require('./service/SttModelInstaller');
const WhisperInferenceClient = require('./service/WhisperInferenceClient');

class WhisperServerService {
  static SHERPA_RUNTIME_ID = SttRuntimeView.SHERPA_RUNTIME_ID;
  static WHISPER_HEALTH_TIMEOUT_MS = 90 * 1000;
  static MIN_AUDIO_BYTES = 100;
  static NO_MODEL_MESSAGE = 'No speech-to-text model installed. Download one in the voice setup.';

  constructor(settingsDb, {
    runtimeServer = new WhisperRuntimeServer(),
    launcher = new WhisperServerLauncher(),
    sherpa = null,
    catalog = new SttModelCatalog(),
    installerOptions = {},
  } = {}) {
    this._settings = new SttSettings(settingsDb);
    this._catalog = catalog;
    this._launcher = launcher;
    this.runtimeServer = runtimeServer;
    this._sherpa = sherpa || new SherpaSttBackend({ runtimesDir: () => this.getRuntimesDir() });
    this._library = new SttModelLibrary({ sherpaModelsDir: () => this.getSherpaModelsDir(), whisperModelsDir: () => this.getModelsDir() });
    this._runtimeView = new SttRuntimeView({ launcher });
    this._installer = new SttModelInstaller({
      whisperModelsDir: () => this.getModelsDir(),
      sherpaModelsDir: () => this.getSherpaModelsDir(),
      catalog,
      ...installerOptions,
    });
    this._ensureChain = Promise.resolve();
    this._applyIdleTimeout();
  }

  getRuntimesDir() { return path.join(AppPaths.appBaseDir(), 'runtimes'); }
  getModelsDir() { return path.join(AppPaths.appBaseDir(), 'models', 'whisper'); }
  getSherpaModelsDir() { return path.join(AppPaths.appBaseDir(), 'models', 'stt'); }

  getDefaultModelPath() { return this._settings.getModelPath(); }
  setDefaultModelPath(modelPath) { this._settings.setModelPath(modelPath); }
  getLanguage() { return this._settings.getLanguage(); }
  setLanguage(language) { this._settings.setLanguage(language); }
  getAutoUnloadMs() { return this._settings.getAutoUnloadMs(); }

  listModels() {
    return this._library.list();
  }

  resolveModel() {
    return this._library.resolve(this.getDefaultModelPath());
  }

  resolveModelPath() {
    const model = this.resolveModel();
    return model ? model.path : null;
  }

  async getView() {
    const models = this.listModels();
    const model = this._library.resolve(this.getDefaultModelPath(), models);
    const { engine, ...runtime } = await this._runtimeView.build(this.getRuntimesDir(), model);
    return {
      ...runtime,
      models,
      modelCatalog: this._catalog.list(),
      defaultModelPath: model ? model.path : null,
      defaultModelId: model ? model.id : null,
      defaultEngine: engine,
      recommendedModelId: this._catalog.recommendedId(),
      language: this.getLanguage(),
      serverState: engine === 'sherpa' ? this._sherpa.state : this.runtimeServer.state,
    };
  }

  ensureRunning() {
    this._ensureChain = this._ensureChain.catch(() => {}).then(() => this._ensure());
    return this._ensureChain;
  }

  async transcribe(wav, opts = {}) {
    const audio = WhisperServerService._audioBuffer(wav);
    const startedAt = Date.now();
    const status = await this.ensureRunning();
    const language = (opts.language || this.getLanguage() || 'auto').toLowerCase();
    const text = status && status.engine === 'sherpa'
      ? (await this._sherpa.transcribe(audio, { language })).text
      : await this._transcribeWithWhisper(audio, language);
    return { text, durationMs: Date.now() - startedAt };
  }

  async stop() {
    try { await this._sherpa.stop(); } catch (_) {}
    return this.runtimeServer.stop();
  }

  getStatus() {
    if (this._sherpa.state !== 'idle') return this._sherpa.getStatus();
    return this.runtimeServer.getStatus();
  }

  async downloadModel(catalogId, onEvent) {
    const result = await this._installer.install(catalogId, onEvent);
    if (result && result.success) this.setDefaultModelPath(result.destPath);
    return result;
  }

  cancelDownload() {
    return this._installer.cancel();
  }

  _applyIdleTimeout() {
    this.runtimeServer.setIdleTimeout(this.getAutoUnloadMs());
    this._sherpa.setIdleTimeout(this.getAutoUnloadMs());
  }

  async _ensure() {
    const model = this._modelOrThrow();
    if (model.engine === 'sherpa') return this._ensureSherpa(model);
    return this._ensureWhisper(model);
  }

  _modelOrThrow() {
    const model = this.resolveModel();
    if (model) return model;
    const err = new Error(WhisperServerService.NO_MODEL_MESSAGE);
    err.code = 'NO_STT_MODEL';
    throw err;
  }

  async _ensureSherpa(model) {
    if (this.runtimeServer.state !== 'idle') await WhisperServerService._quietly(() => this.runtimeServer.stop());
    this._sherpa.setIdleTimeout(this.getAutoUnloadMs());
    return this._sherpa.ensureRunning(model);
  }

  async _ensureWhisper(model) {
    if (this._sherpa.state !== 'idle') await WhisperServerService._quietly(() => this._sherpa.stop());
    const server = this.runtimeServer;
    if (this._isServing(model.path)) {
      server.markActive();
      return server.getStatus();
    }
    if (server.state !== 'idle' && server.state !== 'error') await WhisperServerService._quietly(() => server.stop());
    await server.start(await this._whisperLaunch(model.path));
    server.setIdleTimeout(this.getAutoUnloadMs());
    return server.getStatus();
  }

  _isServing(modelPath) {
    const server = this.runtimeServer;
    return server.state === 'ready' && !!server.plan && server.plan.modelPath === modelPath;
  }

  async _whisperLaunch(modelPath) {
    const launch = await this._launcher.resolveLaunch({ runtimesRoot: this.getRuntimesDir(), modelPath, language: this.getLanguage() });
    launch.healthTimeoutMs = WhisperServerService.WHISPER_HEALTH_TIMEOUT_MS;
    return launch;
  }

  async _transcribeWithWhisper(audio, language) {
    this.runtimeServer.markActive();
    const text = await WhisperInferenceClient.transcribe({ port: this.runtimeServer.port, wav: audio, language });
    this.runtimeServer.markActive();
    return text;
  }

  static _audioBuffer(wav) {
    const audio = Buffer.isBuffer(wav) ? wav : Buffer.from(wav || []);
    if (audio.length < WhisperServerService.MIN_AUDIO_BYTES) throw new Error('transcribe: empty audio');
    return audio;
  }

  static async _quietly(action) {
    try { await action(); } catch (_) {}
  }
}

module.exports = WhisperServerService;
