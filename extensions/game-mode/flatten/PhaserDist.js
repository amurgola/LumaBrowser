const fs = require('fs');
const path = require('path');

class PhaserDist {
  static REL = path.join('node_modules', 'phaser', 'dist', 'phaser.min.js');

  static path() {
    return PhaserDist._candidates().find((p) => PhaserDist._exists(p)) || null;
  }

  static _candidates() {
    const candidates = [path.join(__dirname, '..', '..', '..', PhaserDist.REL)];
    const appPath = PhaserDist._appPath();
    if (appPath) candidates.push(path.join(appPath, PhaserDist.REL));
    return candidates;
  }

  static _appPath() {
    try {
      const { app } = require('electron');
      if (app && typeof app.getAppPath === 'function') return app.getAppPath();
    } catch (_) {}
    return null;
  }

  static _exists(p) {
    try { return fs.existsSync(p); } catch (_) { return false; }
  }
}

module.exports = PhaserDist;
