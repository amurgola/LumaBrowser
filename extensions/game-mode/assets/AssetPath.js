const CoreRequire = require('../CoreRequire');

const ContainedPath = CoreRequire.load('shared/fs/ContainedPath');

class AssetPath {
  static PATTERN = /^assets\/.+\.png$/i;

  static resolve(gameRootAbs, rawPath) {
    const rel = String(rawPath || '').replace(/\\/g, '/').replace(/^\.\//, '');
    if (!AssetPath.PATTERN.test(rel)) return { error: 'path must be a .png under assets/, e.g. assets/player.png' };
    try {
      return { rel, abs: ContainedPath.resolveWithin(gameRootAbs, rel) };
    } catch (_) {
      return { error: 'path escapes the game folder' };
    }
  }
}

module.exports = AssetPath;
