const ChatterboxEngine = require('./ChatterboxEngine');
const ChatterboxSettings = require('./ChatterboxSettings');
const ChatterboxSetupActions = require('./ChatterboxSetupActions');
const VoiceStore = require('./VoiceStore');

class ChatterboxExtension {
  static NO_VOICE_SURFACE = 'This LumaBrowser build has no voice-engine extension surface (context.voice). Update the app.';

  constructor() {
    this._reset();
  }

  get voice() { return this.ctx.voice; }
  get extensionId() { return this.ctx.extensionId; }
  runtimesDir() { return ChatterboxSettings.runtimesDir(); }
  modelsDir() { return ChatterboxSettings.modelsDir(); }

  stopEngine() {
    return this.engine.stop().catch(() => {});
  }

  async activate(context) {
    this.ctx = context;
    this._loadState();
    this._createEngine();
    this._registerEngine(context);
    this._registerSetupTab(context);
    this.log('Chatterbox Voice Cloning activated');
    return { engine: this.engine, store: this.store, status: () => this.status() };
  }

  async deactivate() {
    try { if (this.engine) await this.engine.stop(); } catch (_) {}
    if (this.jobs.model) { try { this.jobs.model.cancel(); } catch (_) {} }
    this._reset();
  }

  handleInvoke(action, payload) {
    return this.actions.handle(action, payload);
  }

  status() {
    return this.actions.status();
  }

  log(msg) {
    try { if (this.ctx && this.ctx.logger && this.ctx.logger.info) this.ctx.logger.info(msg); } catch (_) {}
  }

  _reset() {
    this.ctx = null;
    this.store = null;
    this.engine = null;
    this.settings = null;
    this.actions = null;
    this.jobs = { runtime: null, model: null };
  }

  _loadState() {
    this.settings = new ChatterboxSettings();
    this.settings.load();
    this.store = new VoiceStore(this.modelsDir());
    this.actions = new ChatterboxSetupActions(this);
  }

  _createEngine() {
    this.engine = new ChatterboxEngine({
      store: this.store,
      runtimesDir: () => this.runtimesDir(),
      modelsDir: () => this.modelsDir(),
      preferredRuntimeId: () => this.settings.preferredRuntimeId,
      idleMs: () => this.settings.idleMs,
      log: (msg) => this.log(msg),
    });
  }

  _registerEngine(context) {
    if (!context.voice || typeof context.voice.registerTtsEngine !== 'function') throw new Error(ChatterboxExtension.NO_VOICE_SURFACE);
    context.voice.registerTtsEngine(this.engine);
  }

  _registerSetupTab(context) {
    if (context.setupTab && typeof context.setupTab.onInvoke === 'function') {
      context.setupTab.onInvoke((action, payload) => this.handleInvoke(action, payload));
    }
  }
}

module.exports = ChatterboxExtension;
