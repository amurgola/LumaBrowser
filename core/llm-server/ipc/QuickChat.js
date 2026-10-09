const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');
const ChatAdapterRegistry = require('../server/chat/ChatAdapterRegistry');

class QuickChat {
  constructor({ llmServerService, chatRouter, catalog = LlmRuntimeCatalog.shared, adapters = ChatAdapterRegistry }) {
    this._svc = llmServerService;
    this._router = chatRouter;
    this._catalog = catalog;
    this._adapters = adapters;
    this._active = null;
  }

  start({ messages, temperature } = {}, send) {
    const status = this._readyStatus();
    const entry = this._runtimeEntry();
    this.abort();
    this._active = this._adapterFor(entry, status).chat({
      messages,
      temperature,
      onDelta: (text) => send('delta', { text }),
      onReasoningDelta: (text) => send('reasoning-delta', { text }),
      onDone: (summary) => { send('done', summary || {}); this._active = null; },
      onError: (err) => { send('error', { message: err.message }); this._active = null; },
    });
    return { success: true };
  }

  abort() {
    if (!this._active) return;
    try { this._active.abort(); } catch (_) {}
    this._active = null;
  }

  abortAll() {
    this.abort();
    try { this._router.abort(); } catch (_) {}
    return { success: true };
  }

  _readyStatus() {
    const status = this._svc.runtimeServer.getStatus();
    if (status.state !== 'ready' || !status.port) throw new Error(`Server is ${status.state}, not ready.`);
    return status;
  }

  _runtimeEntry() {
    const runtimeId = this._svc.getDefaults().runtimeId;
    const entry = this._catalog.getById(runtimeId);
    if (!entry) throw new Error(`Catalog entry for ${runtimeId} not found.`);
    return entry;
  }

  _adapterFor(entry, status) {
    const server = this._svc.runtimeServer;
    const plan = server.plan || null;
    return this._adapters.createAdapterFor(entry, {
      baseUrl: `http://${status.host || '127.0.0.1'}:${status.port}`,
      apiKey: server.authKey || null,
      model: plan && plan.apiModelName ? plan.apiModelName : null,
    });
  }
}

module.exports = QuickChat;
