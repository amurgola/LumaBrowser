const fs = require('fs');
const path = require('path');

class WindhawkLocator {
  static ENV_ROOT = 'WINDHAWK_ROOT';
  static INI = 'windhawk.ini';
  static DEFAULT_REGISTRY_KEY = 'HKLM\\SOFTWARE\\Windhawk';

  constructor({ env = process.env, fsOps = fs, platform = process.platform } = {}) {
    this._env = env;
    this._fs = fsOps;
    this._platform = platform;
  }

  locate() {
    if (this._platform !== 'win32') return { found: false, reason: 'Windhawk runs on Windows only.' };
    for (const root of this._roots()) {
      const ini = path.join(root, WindhawkLocator.INI);
      if (!this._exists(ini) || !this._exists(path.join(root, 'windhawk.exe'))) continue;
      return this._describe(root, WindhawkLocator.readIni(this._fs, ini));
    }
    return { found: false, reason: 'Windhawk is not installed (windhawk.ini was not found).' };
  }

  _describe(root, ini) {
    const storage = ini.Storage || {};
    const resolve = (value, fallback) => path.resolve(root, this._expand(value || fallback));
    const engineDir = resolve(storage.EnginePath, 'Engine');
    const dataDir = resolve(storage.AppDataPath, 'AppData');
    const registryKey = String(storage.RegistryKey || WindhawkLocator.DEFAULT_REGISTRY_KEY).replace(/^HKLM\\|^HKEY_LOCAL_MACHINE\\/i, '');
    return {
      found: true,
      root,
      version: /^\d+(\.\d+)*$/.test(path.basename(engineDir)) ? path.basename(engineDir) : null,
      portable: String(storage.Portable || '0') === '1',
      compilerDir: resolve(storage.CompilerPath, 'Compiler'),
      engineDir,
      dataDir,
      registryKey,
      modsSourceDir: path.join(dataDir, 'ModsSource'),
      engineModsDir: path.join(dataDir, 'Engine', 'Mods'),
      engineModsWritableDir: path.join(dataDir, 'Engine', 'ModsWritable'),
    };
  }

  _roots() {
    const roots = [];
    if (this._env[WindhawkLocator.ENV_ROOT]) roots.push(this._env[WindhawkLocator.ENV_ROOT]);
    for (const base of [this._env.ProgramFiles, this._env['ProgramW6432'], 'C:\\Program Files']) {
      if (base) roots.push(path.join(base, 'Windhawk'));
    }
    return [...new Set(roots)];
  }

  _expand(value) {
    return String(value).replace(/%([^%]+)%/g, (whole, name) => {
      const key = Object.keys(this._env).find((k) => k.toLowerCase() === name.toLowerCase());
      return key ? this._env[key] : whole;
    });
  }

  _exists(file) {
    try { return this._fs.existsSync(file); } catch (_) { return false; }
  }

  static readIni(fsOps, file) {
    let text = '';
    try {
      const buf = fsOps.readFileSync(file);
      text = buf[0] === 0xFF && buf[1] === 0xFE ? buf.toString('utf16le') : buf.toString('utf8');
    } catch (_) {
      return {};
    }
    const out = {};
    let section = '';
    for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith(';')) continue;
      const head = /^\[(.+)\]$/.exec(line);
      if (head) { section = head[1]; out[section] = out[section] || {}; continue; }
      const eq = line.indexOf('=');
      if (eq > 0) (out[section] = out[section] || {})[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
    return out;
  }
}

module.exports = WindhawkLocator;
