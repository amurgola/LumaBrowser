const path = require('path');
const BinaryLookup = require('../BinaryLookup');

class PathBinaryLookup {
  static DEFAULT_PATHEXT = '.COM;.EXE;.BAT;.CMD';

  static async find(binaryName, env = process.env, platform = process.platform) {
    if (!binaryName) return null;
    const isWindows = platform === 'win32';
    const names = PathBinaryLookup._candidateNames(binaryName, isWindows, env);
    for (const dir of String(env.PATH || '').split(isWindows ? ';' : ':')) {
      if (!dir) continue;
      for (const name of names) {
        const candidate = path.join(dir, name);
        if (await BinaryLookup.pathExists(candidate)) return candidate;
      }
    }
    return null;
  }

  static _candidateNames(binaryName, isWindows, env) {
    if (!isWindows) return [binaryName];
    const exts = String(env.PATHEXT || PathBinaryLookup.DEFAULT_PATHEXT).split(';').map((e) => e.toLowerCase());
    if (exts.some((e) => binaryName.toLowerCase().endsWith(e))) return [binaryName];
    return exts.map((ext) => binaryName + ext);
  }
}

module.exports = PathBinaryLookup;
