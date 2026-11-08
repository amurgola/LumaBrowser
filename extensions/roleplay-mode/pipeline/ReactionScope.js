const { AsyncLocalStorage } = require('async_hooks');

class ReactionScope {
  static CODE = 'RP_REACTION_STOPPED';
  static REASONS = {
    replaced: 'Stopped: this reply was replaced.',
    deleted: 'Stopped: this reply was removed.',
  };

  static _storage = new AsyncLocalStorage();
  static _seq = 0;

  constructor({ conversationId = null, messageId = null, onStopImages = null } = {}) {
    this.conversationId = conversationId;
    this.messageId = messageId;
    this.phase = 'world';
    this.reason = null;
    ReactionScope._seq += 1;
    this.seq = ReactionScope._seq;
    this._onStopImages = onStopImages;
    this._controller = new AbortController();
    this._reconciled = false;
    this.reconciled = new Promise((resolve) => { this._resolve = resolve; });
  }

  get signal() {
    return this._controller.signal;
  }

  get stopped() {
    return this.reason !== null;
  }

  stop(reason = 'replaced') {
    if (this.stopped) return false;
    this.reason = reason;
    try { this._controller.abort(); } catch (_) {}
    if (this.phase === 'images' && typeof this._onStopImages === 'function') {
      try { this._onStopImages(); } catch (_) {}
    }
    this.markReconciled();
    return true;
  }

  throwIfStopped() {
    if (!this.stopped) return;
    const err = new Error(this.reasonText());
    err.code = ReactionScope.CODE;
    throw err;
  }

  reasonText() {
    return ReactionScope.REASONS[this.reason] || 'Stopped.';
  }

  markReconciled() {
    if (this._reconciled) return;
    this._reconciled = true;
    this._resolve();
  }

  get isReconciled() {
    return this._reconciled;
  }

  static run(scope, fn) {
    return ReactionScope._storage.run(scope, fn);
  }

  static current() {
    return ReactionScope._storage.getStore() || null;
  }

  static isStop(err) {
    return !!(err && err.code === ReactionScope.CODE);
  }
}

module.exports = ReactionScope;
