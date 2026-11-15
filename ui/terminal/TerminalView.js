export default class TerminalView {
  static PALETTE = {
    background: '#0b1220', foreground: '#e6e9f2', cursor: '#f59034', cursorAccent: '#0b1220', selectionBackground: '#2a3142',
    black: '#172038', red: '#f87171', green: '#4ade80', yellow: '#fbbf24', blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#67d4e0', white: '#c5cbdb',
    brightBlack: '#76819b', brightRed: '#fca5a5', brightGreen: '#86efac', brightYellow: '#ffb06b', brightBlue: '#a5c0ff', brightMagenta: '#d4bfff', brightCyan: '#a5e8f0', brightWhite: '#f4f6fb',
  };

  static EXITED = (code) => `\r\n\x1b[2m[Process exited${code == null ? '' : ` with code ${code}`}. Press Enter to start it again.]\x1b[0m\r\n`;
  static FAILED = '\r\n\x1b[31mThe shell could not be started.\x1b[0m \x1b[2mPress Enter to try again.\x1b[0m\r\n';
  static MOVED = '\r\n\x1b[2m[This terminal is now shown somewhere else.]\x1b[0m\r\n';

  constructor(container, { xterm, transport, settings = {}, hooks = {} }) {
    this._container = container;
    this._xterm = xterm;
    this._transport = transport;
    this._settings = settings;
    this._hooks = hooks;
    this._queued = [];
    this._live = false;
    this._exited = false;
    this._fitFrame = 0;
  }

  async start() {
    this._createTerminal();
    this._watchSize();
    this._transport.onEvent((event) => this._onEvent(event));
    await this._join(() => this._transport.attach(this._size()));
  }

  focus() {
    if (this._term) this._term.focus();
  }

  dispose() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
    if (this._term) this._term.dispose();
    this._term = null;
  }

  _createTerminal() {
    const { Terminal, FitAddon } = this._xterm;
    this._term = new Terminal({
      fontSize: this._settings.fontSize || 13, fontFamily: this._settings.fontFamily || 'monospace', cursorBlink: true,
      scrollback: 5000, allowProposedApi: true, theme: this._theme(), rightClickSelectsWord: true,
    });
    this._fit = new FitAddon();
    this._term.loadAddon(this._fit);
    this._term.open(this._container);
    this._fit.fit();
    this._term.attachCustomKeyEventHandler((event) => this._onKey(event));
    this._term.onData((data) => this._onTyped(data));
    this._term.onResize(({ cols, rows }) => this._transport.resize(cols, rows));
  }

  _theme() {
    const surface = this._settings.background;
    return surface ? { ...TerminalView.PALETTE, background: surface, cursorAccent: surface } : TerminalView.PALETTE;
  }

  _watchSize() {
    this._resizeObserver = new ResizeObserver(() => {
      if (this._fitFrame) return;
      this._fitFrame = requestAnimationFrame(() => {
        this._fitFrame = 0;
        if (this._term && this._container.clientWidth > 0 && this._container.clientHeight > 0) this._fit.fit();
      });
    });
    this._resizeObserver.observe(this._container);
  }

  _size() {
    return { cols: this._term.cols, rows: this._term.rows };
  }

  async _join(request) {
    this._live = false;
    const joined = await request();
    if (!joined || !this._term) return this._failed();
    this._exited = !!joined.session.exited;
    this._term.reset();
    if (joined.snapshot) this._term.write(joined.snapshot.data);
    this._live = true;
    this._report('onSession', joined.session);
    if (this._exited) this._term.write(TerminalView._ended(joined.session));
    for (const event of this._queued.splice(0)) this._onEvent(event);
  }

  _failed() {
    if (this._term) this._term.write('\r\n\x1b[31mThis terminal could not be started.\x1b[0m\r\n');
  }

  _onEvent(event) {
    if (!this._term) return;
    if (!this._live) return void this._queued.push(event);
    if (event.type === 'data') this._term.write(event.data, () => this._transport.ack(event.data.length));
    else if (event.type === 'state') this._report('onSession', event.session);
    else if (event.type === 'exit') this._onExit(event.session);
    else if (event.type === 'detached') this._term.write(TerminalView.MOVED);
    else if (event.type === 'closed') this._report('onClosed');
  }

  static _ended(session) {
    return session.failedToStart ? TerminalView.FAILED : TerminalView.EXITED(session.exitCode);
  }

  _onExit(session) {
    this._exited = true;
    this._term.write(TerminalView._ended(session));
    this._report('onSession', session);
    this._report('onExit', session);
  }

  _onTyped(data) {
    if (!this._exited) return this._transport.input(data);
    if (data === '\r') this._join(() => this._transport.restart(this._size()));
  }

  _onKey(event) {
    if (event.type !== 'keydown' || !(event.ctrlKey || event.metaKey) || event.altKey) return true;
    const key = (event.key || '').toLowerCase();
    if (key === 'c' && (event.shiftKey || this._term.hasSelection())) return this._copySelection();
    if (key === 'v') return false;
    return true;
  }

  _copySelection() {
    if (this._term.hasSelection()) document.execCommand('copy');
    this._term.clearSelection();
    return false;
  }

  _report(hook, value) {
    if (typeof this._hooks[hook] === 'function') this._hooks[hook](value);
  }
}
