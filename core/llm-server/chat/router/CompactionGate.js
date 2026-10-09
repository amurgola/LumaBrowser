const path = require('path');
const ChatModelRef = require('./ChatModelRef');

class CompactionGate {
  static SETTING = 'core.llmServer.chat.compaction';
  static MIN_MESSAGES = 6;
  static FALLBACK_WINDOW = 4096;
  static READY_WAIT_MS = 20000;
  static READY_POLL_MS = 500;
  static SUMMARY_TIMEOUT_MS = 180000;
  static SUMMARY_TEMPERATURE = 0.2;

  constructor({ llmServerService, db, contextWindow, compaction, complete }) {
    this._service = llmServerService;
    this._db = db;
    this._window = contextWindow;
    this._compaction = compaction;
    this._complete = complete;
  }

  async maybeCompact(messages, modelRef, modeTurn, hooks = null, conversationId = null) {
    try {
      if (!this._enabled(modeTurn) || !Array.isArray(messages) || messages.length < CompactionGate.MIN_MESSAGES) return messages;
      const window = this._windowFor(modelRef);
      if (!this._overBudget(messages, window)) return messages;
      if (!(await this._serverReady(modelRef))) {
        console.log('[llm-chat] compaction skipped: local server not serving this model yet.');
        return messages;
      }
      return await this._compact(messages, modelRef, window, hooks, conversationId);
    } catch (e) {
      console.warn('[llm-chat] compaction skipped:', e && e.message);
      return messages;
    }
  }

  _enabled(modeTurn) {
    if (modeTurn && modeTurn.compact === false) return false;
    return this._db ? this._db.get(CompactionGate.SETTING, true) !== false : true;
  }

  _windowFor(modelRef) {
    return this._window.forRef(modelRef) || this._window.localPerSlot() || CompactionGate.FALLBACK_WINDOW;
  }

  _overBudget(messages, window) {
    if (typeof this._compaction.shouldCompact !== 'function') return true;
    return !!this._compaction.shouldCompact(messages, window);
  }

  async _compact(messages, modelRef, window, hooks, conversationId) {
    CompactionGate._emit(hooks, { phase: 'compacting' });
    const summarize = async (promptMessages) => {
      const r = await this._complete({
        messages: promptMessages,
        temperature: CompactionGate.SUMMARY_TEMPERATURE,
        modelRef,
        timeoutMs: CompactionGate.SUMMARY_TIMEOUT_MS,
        trace: { conversationId, callType: 'compact' },
      });
      return r && r.text ? r.text : null;
    };
    const res = await this._compaction.compact(messages, { contextWindow: window, summarize });
    if (res.compacted) {
      console.log(`[llm-chat] compacted ${res.removed} older message(s) into a summary (window ${window}).`);
      CompactionGate._emit(hooks, { phase: 'compacted', removed: res.removed, contextWindow: window });
    }
    return res.messages;
  }

  async _serverReady(modelRef) {
    if (!ChatModelRef.isLocal(modelRef)) return true;
    const server = this._service && this._service.runtimeServer;
    if (!server || typeof server.getStatus !== 'function') return false;
    const status = await CompactionGate._settledStatus(server);
    if (status.state !== 'ready') return false;
    if (server.dirty || status.dirty) return false;
    return this._servesModel(ChatModelRef.localName(modelRef));
  }

  static async _settledStatus(server) {
    let status = server.getStatus();
    const deadline = Date.now() + CompactionGate.READY_WAIT_MS;
    while (status.state === 'starting' && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, CompactionGate.READY_POLL_MS));
      status = server.getStatus();
    }
    return status;
  }

  _servesModel(want) {
    try {
      const loaded = this._service.getDefaults && this._service.getDefaults().modelPath;
      return !(want && loaded && path.basename(loaded, path.extname(loaded)) !== want);
    } catch (_) {
      return false;
    }
  }

  static _emit(hooks, payload) {
    try { if (hooks && typeof hooks.onStatus === 'function') hooks.onStatus(payload); } catch (_) {}
  }
}

module.exports = CompactionGate;
