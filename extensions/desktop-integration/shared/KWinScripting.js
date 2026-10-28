const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

class KWinScripting {
  static TOOLS = ['qdbus6', 'qdbus'];
  static SERVICE = 'org.kde.KWin';
  static TIMEOUT_MS = 3000;
  static _shared;

  static forSession({ platform = process.platform, env = process.env, ...options } = {}) {
    if (platform !== 'linux') return null;
    if (!(env.WAYLAND_DISPLAY || env.XDG_SESSION_TYPE === 'wayland')) return null;
    return new KWinScripting({ env, ...options });
  }

  static shared(options = {}) {
    if (KWinScripting._shared === undefined) KWinScripting._shared = KWinScripting.forSession(options);
    return KWinScripting._shared;
  }

  constructor({ exec = KWinScripting._exec, fsLike = fs, tmpDir = os.tmpdir(), pid = process.pid, env = process.env, log = null } = {}) {
    this._exec = exec;
    this._fs = fsLike;
    this._tmpDir = tmpDir;
    this._pid = pid;
    this._env = env;
    this._log = log;
    this._tool = undefined;
    this._available = null;
    this._serial = 0;
  }

  get available() {
    return this._available;
  }

  async load(text, name = 'script') {
    if (this._available === false) return null;
    const tool = this._findTool();
    if (!tool) return this._unavailable('no qdbus tool on PATH');
    const file = path.join(this._tmpDir, `luma-kwin-${name}-${this._pid}-${++this._serial}.js`);
    try {
      this._fs.writeFileSync(file, text);
      const loaded = await this._exec(tool, [KWinScripting.SERVICE, '/Scripting', 'org.kde.kwin.Scripting.loadScript', file]);
      const id = loaded.ok ? String(loaded.stdout || '').trim() : '';
      if (!/^\d+$/.test(id)) return this._unavailable(loaded.error || `loadScript answered "${id}"`);
      const ran = await this._exec(tool, [KWinScripting.SERVICE, `/Scripting/Script${id}`, 'org.kde.kwin.Script.run']);
      if (!ran.ok) return this._unavailable(ran.error || 'run failed');
      this._available = true;
      return { id, stop: () => this._exec(tool, [KWinScripting.SERVICE, `/Scripting/Script${id}`, 'org.kde.kwin.Script.stop']).catch(() => ({ ok: false })) };
    } finally {
      try { this._fs.unlinkSync(file); } catch (_) {}
    }
  }

  async runOnce(text, name = 'once') {
    const script = await this.load(text, name);
    if (!script) return false;
    await script.stop();
    return true;
  }

  _unavailable(why) {
    if (this._available !== false && this._log && typeof this._log.warn === 'function') {
      this._log.warn(`KWin scripting is off: ${why}.`);
    }
    this._available = false;
    return null;
  }

  _findTool() {
    if (this._tool !== undefined) return this._tool;
    this._tool = null;
    for (const name of KWinScripting.TOOLS) {
      for (const dir of String((this._env && this._env.PATH) || '').split(path.delimiter).filter(Boolean)) {
        const full = path.join(dir, name);
        try { this._fs.accessSync(full, fs.constants.X_OK); this._tool = full; return full; } catch (_) {}
      }
    }
    return this._tool;
  }

  static _exec(file, args) {
    return new Promise((resolve) => {
      execFile(file, args, { timeout: KWinScripting.TIMEOUT_MS, windowsHide: true }, (err, stdout, stderr) => {
        resolve({ ok: !err, stdout: String(stdout || ''), error: err ? (String(stderr || '').trim() || err.message) : null });
      });
    });
  }
}

module.exports = KWinScripting;
