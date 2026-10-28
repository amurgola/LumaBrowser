const { spawn } = require('child_process');
const KWinScripting = require('./KWinScripting');

class KWinWindows {
  static TAG = 'luma-kwin-activated';
  static JOURNAL = 'journalctl';
  static JOURNAL_ARGS = ['--user', '-f', '-o', 'cat', '-n', '0', '_COMM=kwin_wayland'];
  static _shared;

  static forSession({ scripting = null, ...options } = {}) {
    const link = scripting || KWinScripting.shared(options);
    return link ? new KWinWindows({ scripting: link, ...options }) : null;
  }

  static shared(options = {}) {
    if (KWinWindows._shared === undefined) KWinWindows._shared = KWinWindows.forSession(options);
    return KWinWindows._shared;
  }

  constructor({ scripting, spawnFn = spawn, log = null } = {}) {
    this._scripting = scripting;
    this._spawn = spawnFn;
    this._log = log;
    this._frames = new Map();
    this._captions = new Map();
    this._tail = null;
    this._script = null;
    this._onEvent = null;
    this._buffer = '';
    this._tag = `${KWinWindows.TAG}-${process.pid}`;
  }

  get watching() {
    return !!this._tail;
  }

  frameOf(id) {
    return this._frames.get(String(id)) || null;
  }

  titleOf(id) {
    return this._captions.get(String(id)) || '';
  }

  watch(onEvent) {
    this.stop();
    this._onEvent = onEvent;
    this._startTail();
    this._scripting.load(KWinWindows.script(this._tag), 'watch').then((script) => {
      if (!this._onEvent) { if (script) script.stop(); return; }
      this._script = script;
      if (!script) this._warn('the window pick needs KWin scripting, which did not answer');
    }).catch((err) => this._warn(`the window pick could not start: ${(err && err.message) || err}`));
    return () => this.stop();
  }

  stop() {
    this._onEvent = null;
    if (this._tail) { try { this._tail.kill(); } catch (_) {} this._tail = null; }
    if (this._script) { const s = this._script; this._script = null; s.stop(); }
    this._buffer = '';
  }

  static script(tag) {
    return [
      '(function () {',
      `  const tag = ${JSON.stringify(String(tag))};`,
      '  function report(w, initial) {',
      "    if (!w) { print(tag + ' null'); return; }",
      '    const g = w.frameGeometry;',
      "    print(tag + ' ' + JSON.stringify({ id: String(w.internalId), caption: w.caption, pid: w.pid, cls: w.resourceClass, desktop: !!w.desktopWindow, initial: !!initial, x: Math.round(g.x), y: Math.round(g.y), width: Math.round(g.width), height: Math.round(g.height) }));",
      '  }',
      '  workspace.windowActivated.connect(function (w) { report(w, false); });',
      '  report(workspace.activeWindow, true);',
      '})();',
      '',
    ].join('\n');
  }

  static parse(line, tag) {
    const text = String(line || '');
    const at = text.indexOf(`${tag} `);
    if (at < 0) return undefined;
    const payload = text.slice(at + tag.length + 1).trim();
    if (payload === 'null') return null;
    try {
      const info = JSON.parse(payload);
      return info && typeof info === 'object' && info.id ? info : undefined;
    } catch (_) {
      return undefined;
    }
  }

  _startTail() {
    try {
      const tail = this._spawn(KWinWindows.JOURNAL, KWinWindows.JOURNAL_ARGS, { stdio: ['ignore', 'pipe', 'ignore'] });
      this._tail = tail;
      tail.stdout.on('data', (chunk) => this._onData(String(chunk)));
      tail.on('error', (err) => this._warn(`journal tail failed: ${(err && err.message) || err}`));
      tail.on('exit', () => { if (this._tail === tail) this._tail = null; });
    } catch (err) {
      this._warn(`journal tail could not start: ${(err && err.message) || err}`);
    }
  }

  _onData(text) {
    this._buffer += text;
    const lines = this._buffer.split('\n');
    this._buffer = lines.pop();
    for (const line of lines) {
      const info = KWinWindows.parse(line, this._tag);
      if (info === undefined) continue;
      if (info) {
        this._frames.set(info.id, { x: info.x, y: info.y, width: info.width, height: info.height });
        this._captions.set(info.id, info.caption || '');
      }
      if (this._onEvent) { try { this._onEvent(info); } catch (_) {} }
    }
  }

  _warn(text) {
    if (this._log && typeof this._log.warn === 'function') this._log.warn(`[kwin-windows] ${text}`);
  }
}

module.exports = KWinWindows;
