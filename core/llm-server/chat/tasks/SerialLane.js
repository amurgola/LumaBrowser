class SerialLane {
  constructor() {
    this._tail = Promise.resolve();
    this._waiting = 0;
  }

  get length() {
    return this._waiting;
  }

  push(job) {
    this._waiting += 1;
    const settled = this._tail.then(job).finally(() => { this._waiting -= 1; });
    this._tail = settled.catch(() => {});
    return settled;
  }
}

module.exports = SerialLane;
