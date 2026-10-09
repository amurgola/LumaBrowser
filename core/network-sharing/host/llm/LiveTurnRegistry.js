class LiveTurnRegistry {
  static MAX_ID_LENGTH = 128;

  constructor() {
    this._turns = new Map();
  }

  static turnIdOf(req) {
    const fromHeader = req.get('x-luma-turn-id') || req.get('x-client-request-id');
    const fromBody = req.body && req.body.turnId;
    const id = String(fromHeader || fromBody || '').trim();
    return id && id.length <= LiveTurnRegistry.MAX_ID_LENGTH ? id : null;
  }

  register(id, credential, cancel) {
    if (!id) return () => {};
    const record = { credential, cancel };
    this._turns.set(id, record);
    return () => {
      if (this._turns.get(id) === record) this._turns.delete(id);
    };
  }

  abort(id, credential) {
    const turn = id ? this._turns.get(id) : null;
    if (!turn || !LiveTurnRegistry._sameCredential(turn.credential, credential)) return false;
    this._turns.delete(id);
    try {
      turn.cancel();
    } catch (_) {}
    return true;
  }

  static _sameCredential(a, b) {
    return !!(a && b && (a === b || (a.id != null && a.id === b.id)));
  }
}

module.exports = LiveTurnRegistry;
