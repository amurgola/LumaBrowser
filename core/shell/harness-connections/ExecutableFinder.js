const fs = require('fs');
const path = require('path');

class ExecutableFinder {
  static DEFAULT_PATHEXT = '.COM;.EXE;.BAT;.CMD';

  static find(name, executableDirs = process.env.PATH || '', env = process.env, platform = process.platform) {
    const isWindows = platform === 'win32';
    const suffixes = ExecutableFinder._suffixes(isWindows, env);
    for (const dir of ExecutableFinder._searchDirs(executableDirs)) {
      for (const suffix of suffixes) {
        const candidate = path.resolve(dir, `${name}${suffix}`);
        if (ExecutableFinder._isExecutableFile(candidate, isWindows)) return candidate;
      }
    }
    return null;
  }

  static _suffixes(isWindows, env) {
    if (!isWindows) return [''];
    return ['', ...String(env.PATHEXT || ExecutableFinder.DEFAULT_PATHEXT).split(';')];
  }

  static _searchDirs(executableDirs) {
    return executableDirs.split(path.delimiter)
      .filter(Boolean)
      .filter((dir) => !dir.replace(/\\/g, '/').endsWith('/node_modules/.bin'));
  }

  static _isExecutableFile(candidate, isWindows) {
    try {
      fs.accessSync(candidate, isWindows ? fs.constants.F_OK : fs.constants.X_OK);
      return fs.statSync(candidate).isFile();
    } catch (_) {
      return false;
    }
  }
}

module.exports = ExecutableFinder;
