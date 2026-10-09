class PendingSyntheses {
  constructor() {
    this._requests = new Map();
  }

  get size() {
    return this._requests.size;
  }

  add(id, { onChunk, resolve, reject }) {
    this._requests.set(id, { onChunk, resolve, reject });
  }

  has(id) {
    return this._requests.has(id);
  }

  chunk(id, payload) {
    const request = this._requests.get(id);
    if (!request) return false;
    try { request.onChunk(payload); } catch (_) {}
    return true;
  }

  resolve(id, value) {
    const request = this._take(id);
    if (request) request.resolve(value);
    return !!request;
  }

  reject(id, err) {
    const request = this._take(id);
    if (request) request.reject(err);
    return !!request;
  }

  rejectAll(err) {
    const requests = [...this._requests.values()];
    this._requests.clear();
    for (const request of requests) {
      try { request.reject(err); } catch (_) {}
    }
  }

  _take(id) {
    const request = this._requests.get(id);
    if (request) this._requests.delete(id);
    return request;
  }
}

module.exports = PendingSyntheses;
