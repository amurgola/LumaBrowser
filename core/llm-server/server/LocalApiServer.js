const express = require('express');
const OpenAiLocalRouter = require('./OpenAiLocalRouter');
const AnthropicMessagesRouter = require('./AnthropicMessagesRouter');
const OpenAiResponsesRouter = require('./OpenAiResponsesRouter');
const LocalApiUpstream = require('./LocalApiUpstream');
const LocalApiListener = require('./LocalApiListener');

class LocalApiServer {
  static ENABLED_KEY = 'localApi.enabled';
  static PORT_KEY = 'localApi.port';
  static DEFAULT_PORT = 8317;
  static BIND_HOST = LocalApiListener.BIND_HOST;
  static LOG_TAG = '[local-api]';

  constructor({ db, llmServerService } = {}) {
    if (!db) throw new Error('LocalApiServer: db is required');
    this._db = db;
    this._upstream = new LocalApiUpstream(llmServerService || null);
    this._listener = new LocalApiListener({ logTag: LocalApiServer.LOG_TAG });
    this._app = null;
  }

  isEnabled() { return !!this._db.get(LocalApiServer.ENABLED_KEY, false); }
  isRunning() { return this._listener.isRunning(); }

  address() {
    return this._listener.address();
  }

  getPort() {
    return LocalApiServer._validPort(this._db.get(LocalApiServer.PORT_KEY, LocalApiServer.DEFAULT_PORT))
      || LocalApiServer.DEFAULT_PORT;
  }

  getBaseUrl() {
    return `${this.getAnthropicBaseUrl()}/v1`;
  }

  getAnthropicBaseUrl() {
    return `http://${LocalApiServer.BIND_HOST}:${this._listener.port || this.getPort()}`;
  }

  getConfig() {
    const up = this._upstream.current();
    return {
      enabled: this.isEnabled(),
      port: this.getPort(),
      running: this.isRunning(),
      baseUrl: this.getBaseUrl(),
      anthropicBaseUrl: this.getAnthropicBaseUrl(),
      modelLoaded: !!up,
      model: up ? up.modelId : null,
      error: this._listener.lastError,
    };
  }

  async setEnabled(enabled) {
    const next = !!enabled;
    this._db.set(LocalApiServer.ENABLED_KEY, next);
    if (!next) return this._disable();
    const r = await this.start(this.getPort());
    if (r.success) return { success: true, port: r.port };
    this._db.set(LocalApiServer.ENABLED_KEY, false);
    return { success: false, error: r.error };
  }

  async setPort(port) {
    const p = LocalApiServer._validPort(port);
    if (!p) return { success: false, error: 'Port must be a number from 1 to 65535.' };
    this._db.set(LocalApiServer.PORT_KEY, p);
    if (this.isEnabled()) {
      const r = await this.start(p);
      if (!r.success) return { success: false, error: r.error, port: p };
    }
    return { success: true, port: p };
  }

  async resume() {
    if (!this.isEnabled()) return { success: true, skipped: true };
    const r = await this.start(this.getPort());
    if (!r.success) console.warn(`${LocalApiServer.LOG_TAG} resume failed:`, r.error);
    return r;
  }

  start(port) {
    return this._listener.start(this.getApp(), port);
  }

  stop() {
    return this._listener.stop();
  }

  getApp() {
    if (!this._app) this._app = this._buildApp();
    return this._app;
  }

  _buildApp() {
    const app = express();
    app.disable('x-powered-by');
    app.use(OpenAiLocalRouter.create(this._openAiDeps()));
    app.use(OpenAiResponsesRouter.create(this._translatedDeps()));
    app.use(AnthropicMessagesRouter.create(this._translatedDeps()));
    app.use((req, res) => res.status(404).json({
      error: { message: `Unknown route ${req.method} ${req.path}`, type: 'invalid_request_error' },
    }));
    return app;
  }

  _openAiDeps() {
    return {
      getUpstream: () => this._upstream.current(),
      listModels: () => this._upstream.listModels(),
      hostDial: () => this._upstream.hostDial(),
      getThinking: () => this._upstream.getThinking(),
      warn: LocalApiServer._warn,
    };
  }

  _translatedDeps() {
    return {
      getUpstream: () => this._upstream.current(),
      hostDial: () => this._upstream.hostDial(),
      warn: LocalApiServer._warn,
    };
  }

  async _disable() {
    await this.stop();
    this._listener.lastError = null;
    return { success: true };
  }

  static _warn(message) {
    console.warn(LocalApiServer.LOG_TAG, message);
  }

  static _validPort(value) {
    const p = Number(value);
    return Number.isInteger(p) && p >= 1 && p <= 65535 ? p : null;
  }
}

module.exports = LocalApiServer;
