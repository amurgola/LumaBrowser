class ShellIntegrationParser {
  static OSC_LUMA = 633;
  static OSC_FINALTERM = 133;
  static OSC_CWD_URL = 7;
  static OSC_CONEMU = 9;

  constructor(listener = () => {}) {
    this._listener = listener;
    this._integrated = false;
    this._running = false;
    this._cwd = null;
    this._command = null;
    this._pendingCommand = null;
    this._exitCode = null;
  }

  attach(term) {
    term.parser.registerOscHandler(ShellIntegrationParser.OSC_LUMA, (data) => this._onMark(data));
    term.parser.registerOscHandler(ShellIntegrationParser.OSC_FINALTERM, (data) => this._onMark(data));
    term.parser.registerOscHandler(ShellIntegrationParser.OSC_CWD_URL, (data) => this._onCwdUrl(data));
    term.parser.registerOscHandler(ShellIntegrationParser.OSC_CONEMU, (data) => this._onConEmu(data));
    return this;
  }

  get state() {
    return { integrated: this._integrated, running: this._running, cwd: this._cwd, command: this._command, exitCode: this._exitCode };
  }

  _onMark(data) {
    const text = String(data || '');
    const kind = text.charAt(0);
    const rest = text.length > 1 ? text.slice(2) : '';
    if (kind === 'A') this._promptStarted();
    else if (kind === 'C') this._commandStarted();
    else if (kind === 'D') this._commandEnded(rest);
    else if (kind === 'E') this._pendingCommand = ShellIntegrationParser.unescape(rest.split(';')[0]);
    else if (kind === 'P') this._property(rest);
    return true;
  }

  _promptStarted() {
    this._integrated = true;
    this._running = false;
    this._listener({ type: 'prompt' });
  }

  _commandStarted() {
    this._running = true;
    this._exitCode = null;
    this._command = this._pendingCommand;
    this._pendingCommand = null;
    this._listener({ type: 'command-start', command: this._command });
  }

  _commandEnded(rest) {
    const code = rest === '' ? null : parseInt(rest, 10);
    this._running = false;
    this._exitCode = Number.isInteger(code) ? code : null;
    this._listener({ type: 'command-end', exitCode: this._exitCode });
  }

  _property(rest) {
    const at = rest.indexOf('=');
    if (at > 0 && rest.slice(0, at) === 'Cwd') this._setCwd(ShellIntegrationParser.unescape(rest.slice(at + 1)));
  }

  _onCwdUrl(data) {
    try {
      const url = new URL(String(data || ''));
      if (url.protocol === 'file:') this._setCwd(ShellIntegrationParser._pathOfFileUrl(url));
    } catch (_) {}
    return true;
  }

  _onConEmu(data) {
    const text = String(data || '');
    if (!text.startsWith('9;')) return false;
    this._setCwd(text.slice(2).replace(/^"|"$/g, ''));
    return true;
  }

  _setCwd(cwd) {
    if (!cwd || cwd === this._cwd) return;
    this._cwd = cwd;
    this._listener({ type: 'cwd', cwd });
  }

  static _pathOfFileUrl(url) {
    const decoded = decodeURIComponent(url.pathname);
    return /^\/[A-Za-z]:/.test(decoded) ? decoded.slice(1).replace(/\//g, '\\') : decoded;
  }

  static unescape(text) {
    return String(text || '').replace(/\\(\\|x([0-9a-fA-F]{2}))/g, (_m, whole, hex) => (hex ? String.fromCharCode(parseInt(hex, 16)) : '\\'));
  }
}

module.exports = ShellIntegrationParser;
