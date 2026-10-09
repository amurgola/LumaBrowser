const ServerLauncher = require('../server/ServerLauncher');

class GambitTarget {
  static NO_DEFAULT = 'No default model is configured to grade.';
  static NOT_DEFAULT = 'That model is not the configured default. Set it as the default model, then run the gambit.';
  static DEPS_NOT_READY = 'Browser and extension services are not ready yet.';
  static NO_LOCAL_MODEL = 'No local model is configured to grade.';

  constructor({ llmServerService, chatRouter, launcher = ServerLauncher.shared }) {
    this._svc = llmServerService;
    this._router = chatRouter;
    this._launcher = launcher;
  }

  async resolve(modelPath, send) {
    const defaults = this._svc.getDefaults ? this._svc.getDefaults() : null;
    const livePath = (defaults && defaults.modelPath) || null;
    if (!livePath) return { error: GambitTarget.NO_DEFAULT };
    if (modelPath && modelPath !== livePath) return { error: GambitTarget.NOT_DEFAULT };
    const bootError = await this._ensureServerReady(send);
    if (bootError) return { error: bootError };
    const deps = this._router.getAgentDeps();
    if (!deps || !deps.browserService) return { error: GambitTarget.DEPS_NOT_READY };
    const { modelRef, modelLabel } = this._localModel();
    if (!modelRef) return { error: GambitTarget.NO_LOCAL_MODEL };
    return { livePath, defaults, deps, modelRef, modelLabel };
  }

  async _ensureServerReady(send) {
    if (this._state() === 'ready') return null;
    send('server', { state: 'starting' });
    try {
      const boot = await this._launcher.resolveAndStart(this._svc);
      if (boot && boot.success === false) {
        send('server', { state: 'failed', error: boot.error });
        return `Could not start the chat server: ${boot.error || 'unknown error'}`;
      }
    } catch (err) {
      send('server', { state: 'failed', error: err.message });
      return `Could not start the chat server: ${err.message}`;
    }
    return this._confirmReady(send);
  }

  _confirmReady(send) {
    const state = this._state();
    if (state !== 'ready') {
      send('server', { state: 'failed', error: state });
      return `The chat server did not come up (${state}).`;
    }
    send('server', { state: 'started' });
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

module.exports = GambitTarget;
