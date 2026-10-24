const { execFile } = require('child_process');

class WindhawkRegistry {
  static HIVE = 'HKLM';
  static VALUE_LINE = /^ {4}(.+?) {4}(REG_[A-Z_]+)(?: {4}(.*))?$/;

  constructor({ run = WindhawkRegistry._run } = {}) {
    this._run = run;
  }

  async readMods(registryKey) {
    const root = `${WindhawkRegistry.HIVE}\\${registryKey}\\Engine\\Mods`;
    const { code, stdout } = await this._run(['query', root, '/s', '/reg:64']);
    if (code !== 0) return {};
    return WindhawkRegistry.parse(stdout, root);
  }

  static parse(stdout, root) {
    const mods = {};
    const prefix = WindhawkRegistry._longHive(root).toLowerCase() + '\\';
    let current = null;
    for (const line of String(stdout || '').split(/\r?\n/)) {
      if (/^HKEY_/.test(line)) {
        current = WindhawkRegistry._target(mods, line.trim(), prefix);
        continue;
      }
      const match = WindhawkRegistry.VALUE_LINE.exec(line);
      if (!match || !current) continue;
      const [, name, type, data = ''] = match;
      current[name] = WindhawkRegistry._value(type, data);
    }
    return mods;
  }

  static _target(mods, keyPath, prefix) {
    if (!keyPath.toLowerCase().startsWith(prefix)) return null;
    const parts = keyPath.slice(prefix.length).split('\\');
    const id = parts[0];
    if (!id) return null;
    mods[id] = mods[id] || { values: {}, settings: {} };
    if (parts.length === 1) return mods[id].values;
    if (parts.length === 2 && parts[1].toLowerCase() === 'settings') return mods[id].settings;
    return null;
  }

  static _value(type, data) {
    if (type === 'REG_DWORD' || type === 'REG_QWORD') return parseInt(data, 16) >>> 0;
    return data;
  }

  static _longHive(key) {
    return key.replace(/^HKLM\\/i, 'HKEY_LOCAL_MACHINE\\');
  }

  static _run(args) {
    return new Promise((resolve) => {
      execFile('reg.exe', args, { windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (err, stdout) => {
        resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, stdout: stdout || '' });
      });
    });
  }
}

module.exports = WindhawkRegistry;
