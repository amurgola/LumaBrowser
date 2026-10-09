class FetchQueue {
  constructor({ maxConcurrent = 2, maxQueued = 8 } = {}) {
    this._maxConcurrent = maxConcurrent;
    this._maxQueued = maxQueued;
    this._inFlight = 0;
    this._waiting = [];
  }

  run(job) {
    if (this._waiting.length >= this._maxQueued) return Promise.resolve(this._overflowResult());
    return new Promise((resolve) => {
      this._waiting.push({ job, resolve });
      this._startNext();
    });
  }

  _overflowResult() {
    return {
      success: false,
      error: `Too many page fetches in flight (max ${this._maxConcurrent} concurrent, ${this._maxQueued} queued): `
        + 'slow down and batch requests.',
    };
  }

  _startNext() {
    if (this._inFlight >= this._maxConcurrent || !this._waiting.length) return;
    this._inFlight++;
    const { job, resolve } = this._waiting.shift();
    Promise.resolve()
      .then(job)
      .catch((err) => ({ success: false, error: (err && err.message) || String(err) }))
      .then((result) => this._finish(resolve, result));
  }

  _finish(resolve, result) {
    this._inFlight--;
    resolve(result);
    this._startNext();
  }
}

module.exports = FetchQueue;
