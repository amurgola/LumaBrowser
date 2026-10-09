'use strict';

const crypto = require('crypto');

class CommitRequestBook {
  constructor() {
    this._pending = new Map();
  }

  open(send) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      this._pending.set(requestId, { resolve, reject });
      if (send(requestId)) return;
      this._pending.delete(requestId);
      reject(new Error('Could not reach LumaBrowser.'));
    });
  }

  settle(p) {
    const request = p.requestId ? this._pending.get(p.requestId) : null;
    if (!request) return;
    this._pending.delete(p.requestId);
    if (p.ok && p.text && String(p.text).trim()) request.resolve(String(p.text));
    else request.reject(new Error(p.message ? String(p.message) : 'LumaBrowser returned no draft.'));
  }

  failAll(reason) {
    const pending = [...this._pending.values()];
    this._pending.clear();
    for (const p of pending) p.reject(new Error(reason));
  }
}

module.exports = CommitRequestBook;
