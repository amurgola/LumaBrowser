class PendingTranscriptions {
  constructor() {
    this._requests = new Map();
    this._counter = 0;
  }

  get size() {
    return this._requests.size;
  }

  nextId() {
    this._counter += 1;
    return `stt-${this._counter}`;
  }

  add(id, { resolve, reject, timeoutMs, onTimeout }) {
    const timer = setTimeout(() => {
      this._requests.delete(id);
      reject(new Error('transcription timed out'));
      if (onTimeout) onTimeout();
    }, timeoutMs);
    this._requests.set(id, { resolve, reject, timer });
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
    for (const id of [...this._requests.keys()]) this.reject(id, err);
  }

  _take(id) {
    const request = this._requests.get(id);
    if (!request) return null;
    this._requests.delete(id);
    clearTimeout(request.timer);
    return request;
  }
}

module.exports = PendingTranscriptions;
