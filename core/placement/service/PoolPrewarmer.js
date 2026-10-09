const fs = require('fs');

class PoolPrewarmer {
  static CHUNK_BYTES = 8 * 1024 * 1024;

  constructor({ poolModels, openStream = (file, options) => fs.createReadStream(file, options) }) {
    this._poolModels = poolModels;
    this._openStream = openStream;
    this._running = false;
  }

  async prewarm() {
    if (this._running) return;
    this._running = true;
    try {
      for (const file of await this._poolModels.files()) await this._readThrough(file);
    } finally {
      this._running = false;
    }
  }

  prewarmInBackground() {
    Promise.resolve().then(() => this.prewarm()).catch(() => {});
  }

  _readThrough(file) {
    return new Promise((resolve) => {
      try {
        const stream = this._openStream(file, { highWaterMark: PoolPrewarmer.CHUNK_BYTES });
        stream.on('data', () => {});
        stream.on('end', resolve);
        stream.on('error', resolve);
      } catch (_) {
        resolve();
      }
    });
  }
}

module.exports = PoolPrewarmer;
