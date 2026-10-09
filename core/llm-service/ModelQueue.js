class ModelQueue {
  constructor(modelId, maxConcurrency) {
    this.modelId = modelId;
    this.maxConcurrency = maxConcurrency;
    this._activeCount = 0;
    this._completedCount = 0;
    this._pending = [];
  }

  add(task) {
    this._pending.push(task);
  }

  hasFreeSlot() {
    return this._activeCount < this.maxConcurrency && this._pending.length > 0;
  }

  takeNext() {
    this._activeCount++;
    return this._pending.shift();
  }

  finish() {
    this._activeCount--;
    this._completedCount++;
  }

  pendingTasks() {
    return this._pending.slice();
  }

  stats() {
    return {
      modelId: this.modelId,
      activeCount: this._activeCount,
      pendingCount: this._pending.length,
      maxConcurrency: this.maxConcurrency,
      completedCount: this._completedCount,
    };
  }
}

module.exports = ModelQueue;
