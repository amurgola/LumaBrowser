const os = require('os');
const path = require('path');

class GameFolders {
  static ROOT_NAME = 'game-mode';
  static KB_CACHE_NAME = '.kb-cache';

  static resolveDataDir() {
    if (process.env.LUMA_DATA_DIR) return process.env.LUMA_DATA_DIR;
    const userData = GameFolders._electronUserData();
    return userData || path.join(os.tmpdir(), 'lumabrowser');
  }

  static sanitizeConvId(conversationId) {
    const clean = String(conversationId == null ? '' : conversationId).replace(/[^A-Za-z0-9_-]/g, '');
    if (!clean) throw new Error('unusable conversation id');
    return clean;
  }

  static _electronUserData() {
    try {
      const { app } = require('electron');
      if (app && typeof app.getPath === 'function') return app.getPath('userData');
    } catch (_) {}
    return null;
  }

  constructor(dataDir = GameFolders.resolveDataDir()) {
    this.gamesRoot = path.join(dataDir, GameFolders.ROOT_NAME);
    this.kbCacheDir = path.join(this.gamesRoot, GameFolders.KB_CACHE_NAME);
  }

  gameDirFor(conversationId) {
    return path.join(this.gamesRoot, GameFolders.sanitizeConvId(conversationId));
  }
}

module.exports = GameFolders;
