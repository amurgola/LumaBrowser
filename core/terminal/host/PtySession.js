const ShellIntegrationParser = require('./ShellIntegrationParser');
const ScreenReader = require('./ScreenReader');
const KeySequences = require('./KeySequences');
const OutputWatch = require('./OutputWatch');

class PtySession {
  static TERM_NAME = 'xterm-256color';
  static SCROLLBACK = 5000;
  static FLUSH_MS = 8;
  static HIGH_WATER_CHARS = 512 * 1024;
  static LOW_WATER_CHARS = 64 * 1024;
  static SETTLE_MS = 1500;
  static STALL_MS = 4000;
  static SEND_SETTLE_MS = 350;
  static READY_TIMEOUT_MS = 8000;
  static DEFAULT_RUN_TIMEOUT_MS = 30 * 1000;
  static DEFAULT_SEND_WAIT_MS = 2000;
  static DEFAULT_MAX_CHARS = 12000;
  static DEFAULT_TAIL_LINES = 60;
  static PATTERN_WINDOW_CHARS = 8000;
  static PASTE_OPEN = '\x1b[200~';
  static PASTE_CLOSE = '\x1b[201~';
  static MIN_SIZE = 2;

  constructor({ id, pty, xterm, launch, size, emit, timers = { setTimeout, clearTimeout } }) {
    this.id = id;
    this._pty = pty;
    this._xterm = xterm;
    this._launch = launch;
    this._size = PtySession._validSize(size) || { cols: 120, rows: 30 };
    this._emit = emit;
    this._timers = timers;
    this._watches = new Set();
    this._pending = '';
    this._flushTimer = null;
    this._viewed = false;
    this._unackedChars = 0;
    this._paused = false;
    this._exited = false;
    this._exitCode = null;
    this._title = '';
    this._agentMark = null;
    this._sawOutput = false;
    this._failedToStart = false;
    this._ready = null;
  }

  start() {
    this._createScreen();
    this._spawnShell();
    this._ready = this._watch(this._readyConditions()).promise;
    return this.info();
  }

  write(data) {
    if (!this._exited) this._child.write(String(data));
  }

  resize(size) {
    const valid = PtySession._validSize(size);
    if (!valid || this._exited) return;
    this._size = valid;
    this._child.resize(valid.cols, valid.rows);
    this._term.resize(valid.cols, valid.rows);
    this._emit('state', this.info());
  }

  setViewed(viewed) {
    this._viewed = !!viewed;
    if (!this._viewed) this._caughtUp(0);
  }

  ack(chars) {
    this._caughtUp(Math.max(0, this._unackedChars - (Number(chars) || 0)));
  }

  info() {
    const shell = this._integration.state;
    return {
      id: this.id, profileId: this._launch.profileId || null, label: this._launch.label || '', pid: this._child ? this._child.pid : null,
      cols: this._size.cols, rows: this._size.rows, title: this._title, cwd: shell.cwd || this._launch.cwd || null,
      integrated: shell.integrated, busy: shell.running, command: shell.running ? shell.command : null,
      lastExitCode: shell.exitCode, alternateScreen: this._term.buffer.active.type === 'alternate',
      exited: this._exited, exitCode: this._exitCode, failedToStart: this._failedToStart,
    };
  }

  async snapshot() {
    await this._parsed();
    this._flush();
    return { data: this._serializer.serialize({ scrollback: PtySession.SCROLLBACK }), cols: this._size.cols, rows: this._size.rows };
  }

  async run({ command, timeoutMs = PtySession.DEFAULT_RUN_TIMEOUT_MS, maxChars = PtySession.DEFAULT_MAX_CHARS } = {}) {
    if (this._exited) return this._runResult('exit', '', Date.now(), maxChars);
    await this._settled();
    const mark = this._reader.mark();
    const startedAt = Date.now();
    const watch = this._watch(this._runConditions(timeoutMs));
    this._child.write(`${this._asInput(command)}\r`);
    const reason = await watch.promise;
    await this._parsed();
    const output = this._reader.from(mark);
    if (mark) mark.dispose();
    this._moveAgentMark();
    return this._runResult(reason, output, startedAt, maxChars);
  }

  async read({ mode = 'new', lines = PtySession.DEFAULT_TAIL_LINES, waitMs = 0, until = null, maxChars = PtySession.DEFAULT_MAX_CHARS } = {}) {
    await this._settled();
    const waited = waitMs > 0 && !this._exited ? await this._waitBeforeRead(waitMs, until) : null;
    await this._parsed();
    const text = this._textFor(mode, lines);
    return { mode, text: ScreenReader.clip(text, maxChars), truncated: text.length > maxChars, waited, ...this._position() };
  }

  async send({ text = '', keys = [], submit = false, waitMs = PtySession.DEFAULT_SEND_WAIT_MS } = {}) {
    if (this._exited) return { error: 'This terminal\'s process has exited.', ...this._position() };
    const encoded = KeySequences.encode(keys, { applicationCursor: !!this._term.modes.applicationCursorKeysMode });
    if (encoded.error) return { error: encoded.error };
    await this._settled();
    const watch = this._watch({ timeoutMs: waitMs, idleMs: PtySession.SEND_SETTLE_MS });
    this._child.write(`${this._asInput(text)}${submit ? '\r' : ''}${encoded.data}`);
    await watch.promise;
    await this._parsed();
    return { screen: this._reader.screen(), ...this._position() };
  }

  kill() {
    if (this._exited) return;
    try { this._child.kill(); } catch (_) {}
  }

  dispose() {
    for (const watch of this._watches) watch.cancel();
    if (this._flushTimer) this._timers.clearTimeout(this._flushTimer);
    this.kill();
    try { this._term.dispose(); } catch (_) {}
  }

  _createScreen() {
    const { Terminal, SerializeAddon } = this._xterm;
    this._term = new Terminal({ cols: this._size.cols, rows: this._size.rows, scrollback: PtySession.SCROLLBACK, allowProposedApi: true });
    this._serializer = new SerializeAddon();
    this._term.loadAddon(this._serializer);
    this._reader = new ScreenReader(this._term);
    this._integration = new ShellIntegrationParser((event) => this._onShellMark(event)).attach(this._term);
    this._term.onTitleChange((title) => this._onTitle(title));
  }

  _spawnShell() {
    const { file, args, cwd, env } = this._launch;
    this._child = this._pty.spawn(file, args || [], { name: PtySession.TERM_NAME, cols: this._size.cols, rows: this._size.rows, cwd, env });
    this._child.onData((data) => this._onData(data));
    this._child.onExit((event) => this._onExit(event));
  }

  _onData(data) {
    this._sawOutput = true;
    this._term.write(data, () => this._onParsed());
    this._pending += data;
    if (!this._flushTimer) this._flushTimer = this._timers.setTimeout(() => this._flush(), PtySession.FLUSH_MS);
  }

  _onParsed() {
    for (const watch of this._watches) watch.onOutput();
  }

  _flush() {
    this._flushTimer = null;
    const data = this._pending;
    this._pending = '';
    if (!data) return;
    this._emit('data', { data });
    if (this._viewed) this._fellBehind(data.length);
  }

  _fellBehind(chars) {
    this._unackedChars += chars;
    if (this._paused || this._unackedChars < PtySession.HIGH_WATER_CHARS) return;
    this._paused = true;
    try { this._child.pause(); } catch (_) {}
  }

  _caughtUp(unackedChars) {
    this._unackedChars = unackedChars;
    if (!this._paused || this._unackedChars > PtySession.LOW_WATER_CHARS) return;
    this._paused = false;
    try { this._child.resume(); } catch (_) {}
  }

  _onShellMark(event) {
    if (event.type === 'prompt') for (const watch of this._watches) watch.onPrompt();
    this._emit('state', this.info());
  }

  _onTitle(title) {
    this._title = String(title || '');
    this._emit('state', this.info());
  }

  _onExit(event) {
    this._exited = true;
    this._failedToStart = !this._sawOutput && !(this._child.pid > 0);
    this._exitCode = !this._failedToStart && event && Number.isInteger(event.exitCode) ? event.exitCode : null;
    if (this._flushTimer) this._timers.clearTimeout(this._flushTimer);
    this._flush();
    for (const watch of this._watches) watch.onExit();
    this._emit('exit', this.info());
  }

  _parsed() {
    return new Promise((resolve) => this._term.write('', resolve));
  }

  async _settled() {
    await this._ready;
    await this._parsed();
  }

  _readyConditions() {
    return { timeoutMs: PtySession.READY_TIMEOUT_MS, untilPrompt: true, idleMs: PtySession.SETTLE_MS, idleAccept: () => this._sawOutput };
  }

  _watch(conditions) {
    const watch = new OutputWatch(conditions, this._timers);
    this._watches.add(watch);
    watch.promise.then(() => this._watches.delete(watch));
    return watch;
  }

  _runConditions(timeoutMs) {
    if (!this._integration.state.integrated) return { timeoutMs, idleMs: PtySession.SETTLE_MS };
    return { timeoutMs, untilPrompt: true, idleMs: PtySession.STALL_MS, idleAccept: () => this._reader.cursor().x > 0 };
  }

  _runResult(reason, output, startedAt, maxChars) {
    const status = this._runStatus(reason);
    return {
      status, output: ScreenReader.clip(output, maxChars), truncated: output.length > maxChars,
      exitCode: status === 'done' ? this._integration.state.exitCode : (status === 'exited' ? this._exitCode : null),
      durationMs: Date.now() - startedAt, ...this._position(),
    };
  }

  _runStatus(reason) {
    if (reason === 'prompt') return 'done';
    if (reason === 'exit' || this._exited) return 'exited';
    if (reason === 'idle') return this._integration.state.integrated ? 'waiting' : 'quiet';
    return 'running';
  }

  async _waitBeforeRead(waitMs, until) {
    const conditions = this._readConditions(waitMs, until);
    if (conditions.matches && conditions.matches()) return 'pattern';
    return this._watch(conditions).promise;
  }

  _readConditions(timeoutMs, until) {
    if (until) {
      const pattern = PtySession._pattern(until);
      return { timeoutMs, matches: () => pattern.test(this._recentText()) };
    }
    const shell = this._integration.state;
    if (shell.integrated && shell.running) return { timeoutMs, untilPrompt: true };
    return { timeoutMs, idleMs: PtySession.SETTLE_MS };
  }

  _recentText() {
    return this._reader.from(this._agentMark).slice(-PtySession.PATTERN_WINDOW_CHARS);
  }

  _textFor(mode, lines) {
    if (mode === 'screen') return this._reader.screen();
    if (mode === 'tail') return this._reader.tail(Number(lines) || PtySession.DEFAULT_TAIL_LINES);
    const text = this._reader.from(this._agentMark);
    this._moveAgentMark();
    return text;
  }

  _moveAgentMark() {
    if (this._agentMark) this._agentMark.dispose();
    this._agentMark = this._reader.mark() || null;
  }

  _position() {
    const info = this.info();
    return {
      shell: info.exited ? 'exited' : (info.integrated ? (info.busy ? 'busy' : 'at-prompt') : 'unknown'),
      cwd: info.cwd, fullScreenProgram: info.alternateScreen, exitedWith: info.exited ? info.exitCode : undefined,
    };
  }

  _asInput(text) {
    const value = String(text == null ? '' : text);
    if (!/[\r\n]/.test(value)) return value;
    const body = value.replace(/\r?\n/g, '\r');
    return this._term.modes.bracketedPasteMode ? `${PtySession.PASTE_OPEN}${body}${PtySession.PASTE_CLOSE}` : body;
  }

  static _pattern(until) {
    const source = String(until);
    try { return new RegExp(source, 'i'); } catch (_) { return new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); }
  }

  static _validSize(size) {
    const cols = Math.floor(Number(size && size.cols));
    const rows = Math.floor(Number(size && size.rows));
    return cols >= PtySession.MIN_SIZE && rows >= PtySession.MIN_SIZE ? { cols, rows } : null;
  }
}

module.exports = PtySession;
