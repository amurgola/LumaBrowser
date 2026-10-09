const path = require('path');

class AgentHarnessSettings {
  static DEFAULT_MODEL_KEY = 'core.llmServer.defaults.modelPath';
  static FAILED = 'harness operation failed';

  constructor({ db, mcpEntry, createConnections = null, localApi = null }) {
    this._db = db;
    this._mcpEntry = mcpEntry;
    this._createConnections = createConnections || AgentHarnessSettings._defaultConnections;
    this._localApi = localApi;
    this._connections = null;
  }

  list() {
    return this._guard(() => ({
      success: true,
      harnesses: this._harness().list(),
      skills: this._harness().skillStatus(),
      localApiEnabled: this.localApiEnabled(),
    }));
  }

  connect(id) {
    return this._guard(() => this._harness().connect(String(id)));
  }

  disconnect(id) {
    return this._guard(() => this._harness().disconnect(String(id)));
  }

  writeSkills() {
    return this._guard(() => this._harness().writeSkills());
  }

  preview(id, action = 'connect') {
    return this._guard(() => ({ success: true, ...this._harness().preview(String(id), String(action)) }));
  }

  localApiEnabled() {
    return !!this._db.get(this._local().ENABLED_KEY, false);
  }

  endpoints() {
    const local = this._local();
    const saved = Number(this._db.get(local.PORT_KEY, local.DEFAULT_PORT));
    const port = Number.isInteger(saved) && saved >= 1 && saved <= 65535 ? saved : local.DEFAULT_PORT;
    return {
      openaiBaseUrl: `http://${local.BIND_HOST}:${port}/v1`,
      anthropicBaseUrl: `http://${local.BIND_HOST}:${port}`,
      mcp: this._mcpEntry(),
    };
  }

  model() {
    const modelPath = this._db.get(AgentHarnessSettings.DEFAULT_MODEL_KEY, null);
    return modelPath ? path.basename(modelPath, path.extname(modelPath)) : null;
  }

  _harness() {
    if (!this._connections) {
      this._connections = this._createConnections({ getEndpoints: () => this.endpoints(), getModel: () => this.model() });
    }
    return this._connections;
  }

  _local() {
    if (!this._localApi) this._localApi = require('../../llm-server/server/LocalApiServer');
    return this._localApi;
  }

  _guard(fn) {
    try {
      return fn();
    } catch (e) {
      return { success: false, error: (e && e.message) || AgentHarnessSettings.FAILED };
    }
  }

  static _defaultConnections(options) {
    const HarnessConnections = require('../harness-connections/HarnessConnections');
    return new HarnessConnections(options);
  }
}

module.exports = AgentHarnessSettings;
