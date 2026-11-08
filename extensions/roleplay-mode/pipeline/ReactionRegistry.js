const ReactionScope = require('./ReactionScope');

class ReactionRegistry {
  static WAIT_MS = 90000;

  constructor({ waitMs = ReactionRegistry.WAIT_MS } = {}) {
    this._waitMs = waitMs;
    this._live = new Set();
  }

  start(conversationId, messageId, onStopImages = null) {
    if (conversationId && messageId) {
      for (const s of this._inConversation(conversationId)) if (s.messageId === messageId) s.stop('replaced');
    }
    const scope = new ReactionScope({ conversationId, messageId, onStopImages });
    this._live.add(scope);
    return scope;
  }

  end(scope) {
    this._live.delete(scope);
  }

  supersedeOffPath(conversationId, pathIds, reason = 'replaced') {
    const on = new Set(pathIds || []);
    let n = 0;
    for (const s of this._inConversation(conversationId)) {
      if (!on.has(s.messageId) && s.stop(reason)) n += 1;
    }
    return n;
  }

  settled(conversationId, pathIds) {
    const on = new Set(pathIds || []);
    const waits = this._inConversation(conversationId)
      .filter((s) => on.has(s.messageId) && !s.stopped && !s.isReconciled)
      .map((s) => s.reconciled);
    return ReactionRegistry._within(waits, this._waitMs);
  }

  waitForEarlier(scope) {
    const waits = this._inConversation(scope.conversationId)
      .filter((s) => s !== scope && s.seq < scope.seq && !s.stopped && !s.isReconciled)
      .map((s) => s.reconciled);
    return ReactionRegistry._within(waits, this._waitMs);
  }

  _inConversation(conversationId) {
    if (!conversationId) return [];
    return Array.from(this._live).filter((s) => s.conversationId === conversationId);
  }

  static _within(promises, ms) {
    if (!promises.length) return Promise.resolve();
    let timer = null;
    const cap = new Promise((resolve) => { timer = setTimeout(resolve, ms); });
    return Promise.race([Promise.all(promises), cap]).finally(() => clearTimeout(timer));
  }
}

module.exports = ReactionRegistry;
