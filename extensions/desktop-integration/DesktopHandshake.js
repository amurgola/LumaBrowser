const fs = require('fs');
const os = require('os');
const path = require('path');

class DesktopHandshake {
  static FILE_NAME = 'desktop.json';
  static DIR_NAME = '.lumabrowser';
  static ENV_OVERRIDE = 'LUMA_DESKTOP_HANDSHAKE';
  static FILE_MODE = 0o600;
  static API_BASE = '/api/desktop';

  static handshakePath(env = process.env) {
    const override = env[DesktopHandshake.ENV_OVERRIDE];
    if (override && String(override).trim()) return path.resolve(String(override).trim());
    return path.join(os.homedir(), DesktopHandshake.DIR_NAME, DesktopHandshake.FILE_NAME);
  }

  static read(filePath) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath || DesktopHandshake.handshakePath(), 'utf8'));
      return parsed && Number.isInteger(parsed.port) && typeof parsed.token === 'string' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  constructor({ filePath, version = null, getToken, getFeatures = () => [], now = () => new Date() } = {}) {
    this.filePath = filePath || DesktopHandshake.handshakePath();
    this._version = version;
    this._getToken = getToken;
    this._getFeatures = getFeatures;
    this._now = now;
    this.port = null;
    this._writtenToken = null;
  }

  setPort(port) {
    this.port = Number(port) || null;
    return this.refresh();
  }

  refresh() {
    if (!this.port) return false;
    const body = this._body();
    try {
      DesktopHandshake._writeAtomically(this.filePath, body);
      this._writtenToken = body.token;
      return true;
    } catch (err) {
      console.warn('[desktop-handshake] could not write', this.filePath, err && err.message);
      return false;
    }
  }

  remove() {
    try {
      const current = DesktopHandshake.read(this.filePath);
      if (current && this._writtenToken && current.token === this._writtenToken) fs.unlinkSync(this.filePath);
    } catch (_) {}
    this._writtenToken = null;
  }

  get written() {
    return !!this._writtenToken;
  }

  _body() {
    return {
      port: this.port,
      token: this._getToken(),
      pid: process.pid,
      version: this._version,
      apiBase: DesktopHandshake.API_BASE,
      features: [...this._getFeatures()],
      writtenAt: this._now().toISOString(),
    };
  }

  static _writeAtomically(filePath, body) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(body, null, 2), { mode: DesktopHandshake.FILE_MODE });
    fs.renameSync(tmp, filePath);
    try { fs.chmodSync(filePath, DesktopHandshake.FILE_MODE); } catch (_) {}
  }
}

module.exports = DesktopHandshake;
