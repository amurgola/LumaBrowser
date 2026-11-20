class HostTurnFollowers {
  static WAIT_MS = 400;
  static NOT_OPEN = { success: false };

  constructor({ announce, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), newRequestId = HostTurnFollowers._requestId }) {
    this._announce = announce;
    this._sleep = sleep;
    this._newRequestId = newRequestId;
    this._open = new Map();
  }

  async open(turn) {
    const requestId = this._newRequestId();
    const entry = { conversationId: turn.conversationId, notice: turn.notice || null, senders: [] };
    this._open.set(requestId, entry);
    try { this._announce({ conversationId: turn.conversationId, requestId }); } catch (_) {}
    await this._sleep(HostTurnFollowers.WAIT_MS);
    this._open.delete(requestId);
    return (type, payload) => {
      for (const send of entry.senders) send(type, payload);
    };
  }

  follow(requestId, send) {
    const entry = this._open.get(String(requestId || ''));
    if (!entry || typeof send !== 'function') return HostTurnFollowers.NOT_OPEN;
    entry.senders.push(send);
    return { success: true, conversationId: entry.conversationId, notice: entry.notice };
  }

  static _requestId() {
    return 'host-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }
}

module.exports = HostTurnFollowers;
