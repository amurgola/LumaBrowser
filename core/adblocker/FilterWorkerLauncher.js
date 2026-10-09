const path = require('path');

class FilterWorkerLauncher {
  static ENTRY = path.join(__dirname, 'filterWorker.js');
  static TIMEOUT_MS = 60000;
  static THREAD_NAME = 'adblock-filter-build';

  static build(cachePath) {
    const { Worker } = require('worker_threads');
    return new Promise((resolve, reject) => {
      const worker = new Worker(FilterWorkerLauncher.ENTRY, {
        workerData: { cachePath },
        name: FilterWorkerLauncher.THREAD_NAME,
      });
      FilterWorkerLauncher._settleOnce(worker, resolve, reject);
    });
  }

  static _settleOnce(worker, resolve, reject) {
    let settled = false;
    const finish = (error, bytes) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      worker.terminate().catch(() => {});
      if (error) reject(error); else resolve(bytes);
    };
    const timeout = setTimeout(() => finish(new Error('Filter initialization timed out')), FilterWorkerLauncher.TIMEOUT_MS);
    worker.once('message', (bytes) => finish(null, bytes));
    worker.once('error', (error) => finish(error));
    worker.once('exit', (code) => finish(new Error(`Filter worker exited without an engine (${code})`)));
  }
}

module.exports = FilterWorkerLauncher;
