'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

class AppExecutableLocator {
  static defaultCandidates({ platform = process.platform, env = process.env, home = os.homedir() } = {}) {
    if (platform === 'win32') return AppExecutableLocator._windowsCandidates(env, home);
    if (platform === 'darwin') return ['/Applications/LumaBrowser.app', path.join(home, 'Applications', 'LumaBrowser.app')];
    return ['/opt/LumaBrowser/lumabrowser', '/usr/bin/lumabrowser', '/usr/local/bin/lumabrowser', path.join(home, '.local', 'bin', 'lumabrowser')];
  }

  static resolveExecutable(o = {}) {
    const env = o.env || process.env;
    const home = o.home || os.homedir();
    const exists = o.exists || AppExecutableLocator._exists;
    const readFile = o.readFile || ((p) => fs.readFileSync(p, 'utf8'));
    const fromSettings = o.fromSettings && String(o.fromSettings).trim();
    if (fromSettings && exists(fromSettings)) return fromSettings;
    if (env.LUMA_APP_EXE && exists(env.LUMA_APP_EXE)) return env.LUMA_APP_EXE;
    for (const c of AppExecutableLocator.defaultCandidates({ platform: o.platform, env, home })) if (exists(c)) return c;
    return AppExecutableLocator._fromInstallRecord(home, exists, readFile);
  }

  static _windowsCandidates(env, home) {
    const local = env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const programFiles = env.ProgramFiles || 'C:\\Program Files';
    return [
      path.join(local, 'Programs', 'LumaBrowser', 'LumaBrowser.exe'),
      path.join(local, 'Programs', 'lumabrowser', 'LumaBrowser.exe'),
      path.join(programFiles, 'LumaBrowser', 'LumaBrowser.exe'),
    ];
  }

  static _fromInstallRecord(home, exists, readFile) {
    try {
      const j = JSON.parse(readFile(path.join(home, '.lumabrowser', 'install.json')));
      if (j && j.executable && exists(j.executable)) return j.executable;
    } catch (_) {}
    return null;
  }

  static _exists(p) {
    try { return fs.existsSync(p); } catch (_) { return false; }
  }
}

module.exports = AppExecutableLocator;
