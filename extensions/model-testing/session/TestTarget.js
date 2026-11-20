const CoreRequire = require('../CoreRequire');

const ServerLauncher = CoreRequire.load('llm-server/server/ServerLauncher');
const LlmDefaultsUpdater = CoreRequire.load('llm-server/ipc/LlmDefaultsUpdater');

class TestTarget {
  static NO_MODEL = 'Pick a downloaded model to test.';
  static DEPS_NOT_READY = 'Browser and extension services are not ready yet.';
  static NO_LOCAL_MODEL = 'No local model is configured to test.';

  constructor({ llmServerService, chatRouter, launcher = ServerLauncher.shared, updater = null }) {
    this._svc = llmServerService;
    this._router = chatRouter;
    this._launcher = launcher;
    this._updater = updater || new LlmDefaultsUpdater(llmServerService);
    this._previousPath = null;
  }

  async resolve(modelPath, noteServer) {
    const livePath = modelPath || this._svc.getDefaults().modelPath || null;
    if (!livePath) return { error: TestTarget.NO_MODEL };
    await this._makeDefault(livePath);
    const bootError = await this._ensureServerReady(noteServer);
    if (bootError) return { error: bootError };
    const deps = this._router.getAgentDeps();
    if (!deps || !deps.browserService) return { error: TestTarget.DEPS_NOT_READY };
    const { modelRef, modelLabel } = this._localModel();
    if (!modelRef) return { error: TestTarget.NO_LOCAL_MODEL };
    return { livePath, defaults: this._svc.getDefaults(), deps, modelRef, modelLabel };
  }

  async restore() {
    const previousPath = this._previousPath;
    this._previousPath = null;
    if (previousPath) await this._updater.update({ modelPath: previousPath });
  }

  async _makeDefault(livePath) {
    const currentPath = this._svc.getDefaults().modelPath || null;
    if (currentPath === livePath) return;
    this._previousPath = currentPath;
    await this._updater.update({ modelPath: livePath });
  }

  async _ensureServerReady(noteServer) {
    if (this._state() === 'ready') return null;
    noteServer('starting');
    try {
      const boot = await this._launcher.resolveAndStart(this._svc);
      if (boot && boot.success === false) return TestTarget._bootFailure(noteServer, boot.error || 'unknown error');
    } catch (err) {
      return TestTarget._bootFailure(noteServer, err.message);
    }
    return this._confirmReady(noteServer);
  }

  static _bootFailure(noteServer, detail) {
    noteServer('failed');
    return `Could not start the chat server: ${detail}`;
  }

  _confirmReady(noteServer) {
    const state = this._state();
    if (state !== 'ready') {
      noteServer('failed');
      return `The chat server did not come up (${state}).`;
    }
    noteServer('started');
    return null;
  }

  _state() {
    return this._svc.runtimeServer.getStatus().state;
  }

  _localModel() {
    try {
      const listed = this._router.listModels();
      const local = (listed.models || []).find((m) => m.providerId === 'local');
      return { modelRef: (local && local.ref) || listed.defaultRef || null, modelLabel: (local && local.displayName) || null };
    } catch (_) {
      return { modelRef: null, modelLabel: null };
    }
  }
}

module.exports = TestTarget;
