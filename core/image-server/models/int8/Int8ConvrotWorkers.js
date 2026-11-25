const os = require('os');
const path = require('path');

class Int8ConvrotWorkers {
  static WORKER_PATH = path.join(__dirname, 'Int8ConvrotWorker.js');
  static MAX_WORKERS = 8;

  constructor({ spawn = Int8ConvrotWorkers._spawnThread, size = Int8ConvrotWorkers.defaultSize() } = {}) {
    this._spawn = spawn;
    this._size = size;
    this._idle = [];
    this._all = [];
    this._waiting = [];
    this._owed = new Map();
    this._nextId = 0;
  }

  static defaultSize() {
    return Math.max(1, Math.min(Int8ConvrotWorkers.MAX_WORKERS, Math.floor(os.cpus().length / 2)));
  }

  run(task) {
    return new Promise((resolve, reject) => {
      this._waiting.push({ task, resolve, reject });
      this._dispatch();
    });
  }

  close() {
    for (const worker of this._all) {
      try { worker.terminate(); } catch (_) {}
    }
    this._all = [];
    this._idle = [];
    this._failAll(new Error('The conversion was stopped.'));
  }

  _dispatch() {
    while (this._waiting.length) {
      const worker = this._idle.pop() || this._grow();
      if (!worker) return;
      const job = this._waiting.shift();
      const id = ++this._nextId;
      this._owed.set(id, { ...job, worker });
      worker.postMessage({ id, task: job.task });
    }
  }

  _grow() {
    if (this._all.length >= this._size) return null;
    const worker = this._spawn();
    worker.on('message', (message) => this._onMessage(worker, message));
    worker.on('error', (error) => this._onWorkerLost(worker, error));
    this._all.push(worker);
    return worker;
  }

  _onMessage(worker, { id, codes, scales, error }) {
    const job = this._owed.get(id);
    if (!job) return;
    this._owed.delete(id);
    this._idle.push(worker);
    if (error) job.reject(new Error(error));
    else job.resolve({ codes: new Int8Array(codes), scales: new Float32Array(scales) });
    this._dispatch();
  }

  _onWorkerLost(worker, error) {
    this._all = this._all.filter((other) => other !== worker);
    for (const [id, job] of this._owed) {
      if (job.worker !== worker) continue;
      this._owed.delete(id);
      job.reject(error);
    }
  }

  _failAll(error) {
    for (const job of this._owed.values()) job.reject(error);
    for (const job of this._waiting) job.reject(error);
    this._owed.clear();
    this._waiting = [];
  }

  static _spawnThread() {
    const { Worker } = require('worker_threads');
    return new Worker(Int8ConvrotWorkers.WORKER_PATH);
  }
}

module.exports = Int8ConvrotWorkers;
