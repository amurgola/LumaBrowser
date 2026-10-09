const fs = require('fs');
const SysdepsChecker = require('../shared/runtime/SysdepsChecker');
const PreflightRuntimeIssue = require('./PreflightRuntimeIssue');
const PreflightSysdepsIssue = require('./PreflightSysdepsIssue');

class Preflight {
  static MUSIC_RUNTIME_ID = 'sglang-omni';

  static collectIssues(options) {
    return new Preflight(options).collect();
  }

  constructor({ llmServerService, imageServerService, musicServerService, fileExists, sysdeps } = {}) {
    this._llm = llmServerService;
    this._image = imageServerService;
    this._music = musicServerService;
    this._fileExists = fileExists || Preflight._fileExistsSafely;
    this._sysdeps = sysdeps || new SysdepsChecker();
    this._issues = [];
  }

  async collect() {
    this._issues = [];
    await this._collectSysdeps();
    if (this._llm) await this._collectLlm();
    if (Preflight._isEnabled(this._image)) await this._collectImage();
    if (Preflight._isEnabled(this._music)) await this._collectMusic();
    return { issues: this._issues };
  }

  async _collectSysdeps() {
    this._push(await PreflightSysdepsIssue.collect(this._sysdeps, [this._llm, this._image]));
  }

  async _collectLlm() {
    const defaults = Preflight._defaultsOf(this._llm);
    if (!defaults) return;
    if (defaults.runtimeId) {
      await this._collectRuntime(this._llm, defaults.runtimeId,
        { area: 'llm', server: 'llm', featureLabel: 'Local chat', view: 'settings' });
    }
    if (defaults.modelPath && !this._fileExists(defaults.modelPath)) this._push(Preflight._modelMissingIssue(defaults.modelPath));
  }

  async _collectImage() {
    const defaults = Preflight._defaultsOf(this._image);
    if (!defaults) return;
    if (defaults.runtimeId) {
      await this._collectRuntime(this._image, defaults.runtimeId,
        { area: 'image', server: 'image', featureLabel: 'Image generation', view: 'image' });
    } else if (defaults.modelId || defaults.editModelId || defaults.videoModelId) {
      this._push(Preflight._imageRuntimeUnsetIssue());
    }
  }

  async _collectMusic() {
    const defaults = Preflight._defaultsOf(this._music);
    if (!defaults) return;
    await this._collectRuntime(this._music, Preflight.MUSIC_RUNTIME_ID,
      { area: 'music', server: 'music', featureLabel: 'Music generation', view: 'music' });
    if (defaults.modelId && !(await this._isMusicModelInstalled(defaults.modelId))) {
      this._push(Preflight._musicModelMissingIssue(defaults.modelId));
    }
  }

  async _collectRuntime(service, runtimeId, context) {
    let view = null;
    try { view = await service.ensureRuntimesView(); } catch (_) {}
    const row = PreflightRuntimeIssue.findRuntime(view, runtimeId);
    this._push(PreflightRuntimeIssue.forRow(row, { runtimeId, ...context }));
  }

  async _isMusicModelInstalled(modelId) {
    try {
      const modelsView = await this._music.getModelsView();
      const model = (modelsView.models || []).find((m) => m.id === modelId);
      return !!(model && model.installed);
    } catch (_) {
      return true;
    }
  }

  _push(issue) {
    if (issue) this._issues.push(issue);
  }

  static _isEnabled(service) {
    return !!service && typeof service.isEnabled === 'function' && service.isEnabled();
  }

  static _defaultsOf(service) {
    try { return service.getDefaults(); } catch (_) { return null; }
  }

  static _fileExistsSafely(filePath) {
    try { return fs.existsSync(filePath); } catch (_) { return false; }
  }

  static _modelMissingIssue(modelPath) {
    return {
      id: 'llm-model-missing',
      area: 'llm',
      severity: 'error',
      title: 'Default chat model file is missing',
      detail: `The configured model no longer exists at ${modelPath}. Pick another model or download one in Setup.`,
      fix: { kind: 'open-view', view: 'settings' },
    };
  }

  static _imageRuntimeUnsetIssue() {
    return {
      id: 'image-runtime-unset',
      area: 'image',
      severity: 'error',
      title: 'Image generation has no runtime selected',
      detail: 'An image model is configured, but no runtime is selected to run it. Choose one under Setup, in the Image view.',
      fix: { kind: 'open-view', view: 'image' },
    };
  }

  static _musicModelMissingIssue(modelId) {
    return {
      id: 'music-model-missing',
      area: 'music',
      severity: 'error',
      title: 'Default music model is not downloaded',
      detail: `Music generation is set to use "${modelId}", but its snapshot is not (fully) downloaded. Download it in Setup, in the Music view.`,
      fix: { kind: 'open-view', view: 'music' },
    };
  }
}

module.exports = Preflight;
