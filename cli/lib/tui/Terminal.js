const { EventEmitter } = require('events');
const KeyParser = require('./KeyParser');

class Terminal extends EventEmitter {
  static ESC_TIMEOUT_MS = 40;

  constructor({ input = process.stdin, output = process.stdout } = {}) {
    super();
    this.input = input;
    this.output = output;
    this.started = false;
    this.parseState = { pasting: false, pasteBuf: '' };
    this.rest = '';
    this.escTimer = null;
    this._onData = (d) => this.feed(typeof d === 'string' ? d : d.toString('utf8'));
    this._onResize = () => this.emit('resize');
  }

  get columns() { return this.output.columns || 80; }

  get rows() { return this.output.rows || 24; }

  get isTTY() { return !!(this.input.isTTY && this.output.isTTY); }

  start() {
    if (this.started) return;
    this.started = true;
    if (typeof this.input.setRawMode === 'function') this.input.setRawMode(true);
    if (typeof this.input.setEncoding === 'function') this.input.setEncoding('utf8');
    this.input.on('data', this._onData);
    if (typeof this.input.resume === 'function') this.input.resume();
    this.output.on('resize', this._onResize);
    this.write('\x1b[?2004h');
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    this.write('\x1b[?2004l\x1b[?25h\x1b[0m');
    this.input.removeListener('data', this._onData);
    this.output.removeListener('resize', this._onResize);
    if (typeof this.input.setRawMode === 'function') { try { this.input.setRawMode(false); } catch (_) {} }
    if (typeof this.input.pause === 'function') this.input.pause();
    this._clearEscTimer();
  }

  write(s) {
    this.output.write(s);
  }

  feed(chunk) {
    this._clearEscTimer();
    const { keys, rest } = KeyParser.parse(this.rest + chunk, this.parseState);
    this.rest = rest;
    for (const k of keys) this.dispatch(k);
    if (this.rest) this.escTimer = setTimeout(() => this._flushPendingEscape(), Terminal.ESC_TIMEOUT_MS);
  }

  dispatch(k) {
    if (k.name === 'osc') { this.emit('osc', k.ch); return; }
    if (k.name === 'focus') return;
    this.emit('key', k);
  }

  queryBackground(timeoutMs = 200) {
    return new Promise((resolve) => {
      const t = setTimeout(() => { this.removeListener('osc', on); resolve(null); }, timeoutMs);
      const on = (s) => {
        if (!s.startsWith('\x1b]11;')) return;
        clearTimeout(t);
        this.removeListener('osc', on);
        resolve(s);
      };
      this.on('osc', on);
      this.write('\x1b]11;?\x07');
    });
  }

  _flushPendingEscape() {
    this.escTimer = null;
    const pending = this.rest;
    this.rest = '';
    if (pending === '\x1b') { this.dispatch(KeyParser.key('escape')); return; }
    if (!pending.startsWith('\x1b')) return;
    for (const ch of pending.slice(1)) this.dispatch(KeyParser.key('char', { ch, alt: true }));
  }

  _clearEscTimer() {
    if (this.escTimer) { clearTimeout(this.escTimer); this.escTimer = null; }
  }
}

module.exports = Terminal;
