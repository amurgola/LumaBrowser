const path = require('path');

class RipgrepRun {
  static RAW_OUTPUT_MAX_BYTES = 20 * 1024 * 1024;
  static LINE_MAX_CHARS = 500;
  static STDERR_MAX_CHARS = 4096;
  static NOT_UTF8 = '(line is not valid UTF-8)';

  constructor(child, rootDir, limit) {
    this._child = child;
    this._rootDir = rootDir;
    this._limit = limit;
    this._matches = [];
    this._scanned = 0;
    this._limitReached = false;
    this._bytes = 0;
    this._buffer = '';
    this._stderr = '';
    this._failure = null;
  }

  result() {
    return new Promise((resolve, reject) => {
      this._settle = RipgrepRun._once(resolve, reject);
      this._child.stdout.on('data', (chunk) => this._onStdout(chunk));
      this._child.stderr.on('data', (chunk) => this._onStderr(chunk));
      this._child.on('error', (err) => this._settle(err));
      this._child.on('close', (code) => this._onClose(code));
    });
  }

  static _once(resolve, reject) {
    let settled = false;
    return (err, value) => {
      if (settled) return;
      settled = true;
      if (err) reject(err); else resolve(value);
    };
  }

  _onStdout(chunk) {
    if (this._failure) return;
    this._bytes += chunk.length;
    if (this._bytes > RipgrepRun.RAW_OUTPUT_MAX_BYTES) return this._fail('search produced more output than can be read safely');
    this._buffer += chunk.toString('utf8');
    this._drainLines();
  }

  _drainLines() {
    let newline = this._buffer.indexOf('\n');
    while (newline !== -1 && !this._failure) {
      const line = this._buffer.slice(0, newline).trim();
      this._buffer = this._buffer.slice(newline + 1);
      if (line) this._parseLine(line);
      newline = this._buffer.indexOf('\n');
    }
  }

  _parseLine(line) {
    let record;
    try { record = JSON.parse(line); } catch (_) { return this._fail('search output could not be parsed'); }
    this._handleRecord(record);
  }

  _handleRecord(record) {
    if (!record || typeof record !== 'object') return;
    if (record.type === 'match') this._addMatch(record.data || {});
    else if (record.type === 'summary') this._readSummary(record.data);
  }

  _addMatch(data) {
    if (this._limitReached) return;
    this._matches.push(this._toMatch(data));
    if (this._matches.length < this._limit) return;
    this._limitReached = true;
    this._kill();
  }

  _toMatch(data) {
    const file = data.path ? RipgrepRun._lineText(data.path) : '';
    const line = Number(data.line_number);
    return {
      file: path.relative(this._rootDir, path.resolve(this._rootDir, file)).split(path.sep).join('/'),
      line: Number.isFinite(line) ? line : 0,
      text: RipgrepRun._clip(RipgrepRun._lineText(data.lines).replace(/\r?\n$/, '')),
    };
  }

  _readSummary(data) {
    const stats = (data && data.stats) || {};
    if (Number.isFinite(Number(stats.searches))) this._scanned = Number(stats.searches);
  }

  _onStderr(chunk) {
    if (this._stderr.length < RipgrepRun.STDERR_MAX_CHARS) this._stderr += chunk.toString('utf8');
  }

  _onClose(code) {
    if (this._failure) return this._settle(this._failure);
    if (code === 0 || code === 1 || code === null || this._limitReached) {
      return this._settle(null, { matches: this._matches, limitReached: this._limitReached, scanned: this._scanned });
    }
    return this._settle(new Error(this._stderr.trim().split('\n')[0] || `ripgrep exited with ${code}`));
  }

  _fail(message) {
    this._failure = new Error(message);
    this._kill();
  }

  _kill() {
    try { this._child.kill(); } catch (_) {}
  }

  static _lineText(field) {
    if (!field || typeof field !== 'object') return '';
    if (typeof field.text === 'string') return field.text;
    if (typeof field.bytes === 'string') return RipgrepRun.NOT_UTF8;
    return '';
  }

  static _clip(text) {
    return text.length > RipgrepRun.LINE_MAX_CHARS ? `${text.slice(0, RipgrepRun.LINE_MAX_CHARS)}\u2026` : text;
  }
}

module.exports = RipgrepRun;
