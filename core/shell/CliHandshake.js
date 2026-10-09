const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

class CliHandshake {
  static FILE_NAME = 'cli.json';
  static DIR_NAME = '.lumabrowser';
  static ENV_OVERRIDE = 'LUMA_CLI_HANDSHAKE';
  static FILE_MODE = 0o600;

  static handshakePath() {
    const override = process.env[CliHandshake.ENV_OVERRIDE];
    if (override && String(override).trim()) return path.resolve(String(override).trim());
    return path.join(os.homedir(), CliHandshake.DIR_NAME, CliHandshake.FILE_NAME);
  }

  static read(filePath) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath || CliHandshake.handshakePath(), 'utf8'));
      return CliHandshake._isValidBody(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  static _isValidBody(body) {
    return !!body && Number.isInteger(body.port) && typeof body.token === 'string';
  }

  constructor({ filePath, version } = {}) {
    this.filePath = filePath || CliHandshake.handshakePath();
    this.version = version || null;
    this.token = crypto.randomBytes(32).toString('hex');
    this.port = null;
    this.written = false;
  }

  verify(candidate) {
    const given = Buffer.from(String(candidate || ''), 'utf8');
    const expected = Buffer.from(this.token, 'utf8');
    if (given.length !== expected.length) return false;
    try { return crypto.timingSafeEqual(given, expected); } catch (_) { return false; }
  }

  write(port) {
    this.port = Number(port) || null;
    if (!this.port) return false;
    try {
      this._writeAtomically(this._buildBody());
      this.written = true;
      return true;
    } catch (e) {
      console.warn('[cli-handshake] could not write', this.filePath, e && e.message);
      return false;
    }
  }

  remove() {
    try {
      const current = CliHandshake.read(this.filePath);
      if (current && current.token === this.token) fs.unlinkSync(this.filePath);
    } catch (_) {}
    this.written = false;
  }

  _buildBody() {
    return {
      port: this.port,
      token: this.token,
      pid: process.pid,
      version: this.version,
      writtenAt: new Date().toISOString(),
    };
  }

  _writeAtomically(body) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(body, null, 2), { mode: CliHandshake.FILE_MODE });
    fs.renameSync(tmp, this.filePath);
    try { fs.chmodSync(this.filePath, CliHandshake.FILE_MODE); } catch (_) {}
  }
}

module.exports = CliHandshake;
