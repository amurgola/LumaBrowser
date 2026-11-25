const path = require('path');
const LocalServerConnection = require('./LocalServerConnection');

class LocalApiUpstream {
  static MODELS_CACHE_MS = 15 * 1000;

  constructor(llmServerService = null) {
    this._service = llmServerService;
    this._modelsCache = { at: 0, rows: [] };
  }

  current() {
    const status = this._readyStatus();
    if (!status) return null;
    const live = LocalServerConnection.of(this._service.runtimeServer, status);
    const upstream = { baseUrl: live.baseUrl, apiKey: live.apiKey, modelId: this._modelId(status) };
    return live.model ? { ...upstream, requestModel: live.model } : upstream;
  }

  static requestModel(upstream) {
    return upstream.requestModel || upstream.modelId;
  }

  hostDial() {
    const defaults = this._defaults();
    if (!defaults) return null;
    return defaults.noThink ? 'off' : (defaults.reasoningEffort || null);
  }

  getThinking() {
    const svc = this._service;
    return svc && svc.getRunningThinking ? svc.getRunningThinking() : null;
  }

  async listModels() {
    const up = this.current();
    const rows = await this._installedRows();
    if (!up) return rows;
    return [{ id: up.modelId, current: true }, ...rows.filter((r) => r.id !== up.modelId)];
  }

  _readyStatus() {
    const rs = this._service && this._service.runtimeServer;
    if (!rs || typeof rs.getStatus !== 'function') return null;
    let status;
    try { status = rs.getStatus(); } catch (_) { return null; }
    return status && status.state === 'ready' && status.port ? status : null;
  }

  _modelId(status) {
    let modelPath = status.modelPath || (status.plan && status.plan.modelPath);
    if (!modelPath) modelPath = (this._defaults() || {}).modelPath || null;
    return modelPath ? path.basename(modelPath, path.extname(modelPath)) : 'local';
  }

  _defaults() {
    const svc = this._service;
    if (!svc || typeof svc.getDefaults !== 'function') return null;
    try { return svc.getDefaults() || null; } catch (_) { return null; }
  }

  async _installedRows() {
    const svc = this._service;
    if (!svc || typeof svc.listInstalledChatModels !== 'function') return [];
    const now = Date.now();
    if (now - this._modelsCache.at < LocalApiUpstream.MODELS_CACHE_MS) return this._modelsCache.rows;
    let rows;
    try { rows = (await svc.listInstalledChatModels()).map((m) => ({ id: m.stem })); } catch (_) { rows = []; }
    this._modelsCache = { at: now, rows };
    return rows;
  }
}

module.exports = LocalApiUpstream;
