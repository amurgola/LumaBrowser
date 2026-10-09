class ShardedProgress {
  constructor(send, grandTotal) {
    this._send = send;
    this._grandTotal = Number(grandTotal) || 0;
    this._doneBytes = 0;
  }

  relay() {
    return (type, payload) => {
      if (type === 'download' && payload) this._send('download', this._aggregate(payload));
      else this._send(type, payload);
    };
  }

  addFinished(bytes) {
    this._doneBytes += Number(bytes) || 0;
  }

  _aggregate(payload) {
    const received = this._doneBytes + (payload.received || 0);
    const rate = payload.bytesPerSec || 0;
    const remaining = this._grandTotal - received;
    return {
      received,
      total: this._grandTotal || null,
      bytesPerSec: rate,
      etaMs: (rate > 0 && remaining > 0) ? Math.round((remaining / rate) * 1000) : null,
    };
  }
}

module.exports = ShardedProgress;
