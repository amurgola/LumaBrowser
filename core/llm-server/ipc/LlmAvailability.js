const LlmServerBroadcast = require('./LlmServerBroadcast');

class LlmAvailability {
  static CHANNEL = 'core.llmServer.state';
  static LABELS = {
    off: 'Stopped',
    starting: 'Starting local server…',
    ready: 'Ready',
    busy: 'Generating…',
    waiting: 'Waiting for a free slot…',
    error: 'Server error',
  };
  static OFF_LABEL = 'Stopped, starts on first message';
  static ERROR_DETAIL_CHARS = 120;

  constructor({ llmServerService, chatRouter, broadcast = LlmServerBroadcast.toAll }) {
    this._svc = llmServerService;
    this._router = chatRouter;
    this._broadcast = broadcast;
    this._lastJson = '';
  }

  state() {
    const { models, defaultModel } = this._listedModels();
    if (models.length === 0) {
      return { success: true, status: 'off', configured: false, model: null, label: 'No model configured' };
    }
    const status = this._runtimeStatus();
    const value = this._status(status, defaultModel);
    return { success: true, status: value, configured: true, model: this._modelName(status, defaultModel), label: this._label(value, status) };
  }

  safeState() {
    try {
      return this.state();
    } catch (err) {
      return { success: false, error: err.message, status: 'error', configured: false, model: null, label: err.message };
    }
  }

  watch() {
    this._svc.runtimeServer.on('state-change', () => this.publish());
    if (typeof this._svc.onLocalInFlightChange === 'function') this._svc.onLocalInFlightChange(() => this.publish());
  }

  publish() {
    const state = this._stateOrError();
    const json = JSON.stringify(state);
    if (json === this._lastJson) return;
    this._lastJson = json;
    this._broadcast(LlmAvailability.CHANNEL, state);
  }

  _stateOrError() {
    try {
      return this.state();
    } catch (err) {
      return { success: true, status: 'error', configured: true, model: null, label: err.message };
    }
  }

  _listedModels() {
    let listed = { models: [], defaultRef: null };
    try { listed = this._router.listModels() || listed; } catch (_) {}
    const models = Array.isArray(listed.models) ? listed.models : [];
    const defaultModel = models.find((m) => m.ref === listed.defaultRef) || models[0] || null;
    return { models, defaultModel };
  }

  _runtimeStatus() {
    const server = this._svc.runtimeServer;
    return server && server.getStatus ? server.getStatus() : null;
  }

  _modelName(status, defaultModel) {
    const plan = status && status.plan;
    const planModel = plan && (plan.modelName || plan.modelLabel || plan.model);
    if (planModel) return String(planModel);
    return defaultModel ? (defaultModel.label || defaultModel.ref) : null;
  }

  _status(status, defaultModel) {
    const state = status ? status.state : 'idle';
    if (state === 'starting' || state === 'stopping') return 'starting';
    if (state === 'error') return 'error';
    if (state === 'ready') return this._readyStatus();
    return defaultModel && defaultModel.providerId === 'local' ? 'off' : 'ready';
  }

  _readyStatus() {
    const slots = this._svc.getLocalSlotCount ? this._svc.getLocalSlotCount() : 1;
    const busy = this._svc.getLocalInFlight ? this._svc.getLocalInFlight() : 0;
    if (busy >= slots) return 'waiting';
    return busy > 0 ? 'busy' : 'ready';
  }

  _label(value, status) {
    if (value === 'off') return LlmAvailability.OFF_LABEL;
    if (value === 'error' && status && status.lastError) {
      return `Server error: ${String(status.lastError).slice(0, LlmAvailability.ERROR_DETAIL_CHARS)}`;
    }
    return LlmAvailability.LABELS[value] || value;
  }
}

module.exports = LlmAvailability;
