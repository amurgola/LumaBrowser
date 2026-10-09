const fs = require('fs');
const { createRequire } = require('module');

class FilterBuildWorker {
  static ADAPTER_PACKAGE = '@ghostery/adblocker-electron';

  static async run(parentPort, workerData) {
    const bytes = await FilterBuildWorker.build(workerData.cachePath);
    parentPort.postMessage(bytes, [bytes.buffer]);
  }

  static async build(cachePath) {
    const engine = await FilterBuildWorker._filtersEngine().fromPrebuiltAdsAndTracking(require('cross-fetch'), {
      path: cachePath,
      read: (p) => fs.promises.readFile(p),
      write: (p, bytes) => fs.promises.writeFile(p, bytes),
    });
    return engine.serialize();
  }

  static _filtersEngine() {
    const adapterRequire = createRequire(require.resolve(FilterBuildWorker.ADAPTER_PACKAGE));
    return adapterRequire('@ghostery/adblocker').FiltersEngine;
  }
}

module.exports = FilterBuildWorker;
