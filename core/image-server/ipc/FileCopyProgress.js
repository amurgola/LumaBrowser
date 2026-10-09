const fs = require('fs');

class FileCopyProgress {
  static TICK_MS = 250;

  static copy(srcPath, destPath, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      const total = FileCopyProgress._sizeOf(srcPath);
      const report = FileCopyProgress._safe(onProgress);
      const rs = fs.createReadStream(srcPath);
      const ws = fs.createWriteStream(destPath);
      let received = 0;
      let lastTick = 0;
      rs.on('data', (chunk) => {
        received += chunk.length;
        const now = Date.now();
        if (now - lastTick < FileCopyProgress.TICK_MS) return;
        lastTick = now;
        report(received, total);
      });
      rs.on('error', (err) => FileCopyProgress._closeThen(ws, () => reject(err)));
      ws.on('error', (err) => { rs.destroy(); reject(err); });
      ws.on('finish', () => {
        report(received, total || received);
        resolve();
      });
      rs.pipe(ws);
    });
  }

  static _closeThen(stream, done) {
    if (stream.closed) return done();
    stream.once('close', done);
    stream.destroy();
  }

  static _sizeOf(filePath) {
    try { return fs.statSync(filePath).size; } catch (_) { return 0; }
  }

  static _safe(fn) {
    return (...args) => {
      try { fn(...args); } catch (_) {}
    };
  }
}

module.exports = FileCopyProgress;
