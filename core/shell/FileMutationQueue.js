class FileMutationQueue {
  constructor() {
    this._tails = new Map();
  }

  run(key, fn) {
    const result = this._afterPrevious(key, fn);
    this._recordTail(key, result);
    return result;
  }

  isBusy(key) {
    return this._tails.has(key);
  }

  _afterPrevious(key, fn) {
    const previous = this._tails.get(key) || Promise.resolve();
    return previous.then(() => fn(), () => fn());
  }

  _recordTail(key, result) {
    const tail = result.then(() => {}, () => {});
    this._tails.set(key, tail);
    tail.then(() => { if (this._tails.get(key) === tail) this._tails.delete(key); });
  }
}

module.exports = FileMutationQueue;
