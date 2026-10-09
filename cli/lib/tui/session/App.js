const Screen = require('../Screen');
const Terminal = require('../Terminal');
const Theme = require('../theme/Theme');
const ColorScheme = require('../theme/ColorScheme');
const Editor = require('../editor/Editor');
const UserBlock = require('../blocks/UserBlock');
const NoteBlock = require('../blocks/NoteBlock');
const ErrorBlock = require('../blocks/ErrorBlock');
const HeaderBlock = require('../blocks/HeaderBlock');
const RollbackBuffer = require('../../RollbackBuffer');
const FrameWaiters = require('../../FrameWaiters');
const TurnStatus = require('./TurnStatus');
const TurnFrames = require('./TurnFrames');
const SessionCommands = require('./SessionCommands');
const SessionKeys = require('./SessionKeys');
const SessionView = require('./SessionView');
const HomePath = require('./HomePath');

class App {
  static SPINNER_MS = 180;
  static RENDER_MS = 16;
  static RESIZE_DEBOUNCE_MS = 80;
  static BACKGROUND_QUERY_MS = 150;
  static PLACEHOLDER = 'What should be done here?  / for commands';

  constructor({ link, opts, terminal, theme, now }) {
    this.link = link;
    this.opts = opts;
    this.term = terminal || new Terminal();
    this.theme = theme || Theme.create({ stream: this.term.output });
    this.now = now || (() => Date.now());
    this.screen = new Screen({ write: (s) => this.term.write(s), columns: () => this.term.columns, rows: () => this.term.rows });
    this.frames = new TurnFrames(this);
    this.commands = new SessionCommands(this);
    this.keys = new SessionKeys(this);
    this.view = new SessionView(this);
    this.editor = new Editor({ theme: this.theme, placeholder: App.PLACEHOLDER, complete: (t) => this.complete(t) });
    this._initState(opts);
  }

  async run() {
    const done = new Promise((r) => { this._done = r; });
    this._attach();
    const bg = process.env.LUMA_CLI_THEME ? Promise.resolve(null) : this.term.queryBackground(App.BACKGROUND_QUERY_MS);
    const readyP = this.hello({ agent: this.opts.agent, conversationId: this.opts.resume });
    this._applyScheme(ColorScheme.fromOsc11(await bg));
    const ready = await readyP;
    if (!ready) { this.finish(); return this.exitCode || 1; }
    this.header(ready);
    this.requestRender();
    const first = (this.opts.prompt || '').trim();
    if (first) this.submit(first);
    await done;
    return this.exitCode;
  }

  onResize() {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null;
      this.fullRepaint = true;
      this.requestRender();
    }, App.RESIZE_DEBOUNCE_MS);
  }

  finish() {
    if (this.closed) return;
    this.closed = true;
    this._stopTimers();
    this.screen.paint({ commit: this.view.transcriptLines(this.screen.width), live: [] });
    this.screen.finish();
    this.term.stop();
    try { this.link.close(); } catch (_) {}
    if (this._done) { const d = this._done; this._done = null; d(); }
  }

  onLinkClosed() {
    if (this.closed) return;
    if (this.streaming) {
      this.push(new ErrorBlock('LumaBrowser closed the connection mid-turn.'));
      this.exitCode = this.exitCode || 1;
    } else {
      this.push(new NoteBlock('LumaBrowser closed the connection.', 'warn'));
    }
    this.finish();
  }

  send(type, payload) {
    this.link.send(type, payload || {});
  }

  wait(type, timeoutMs = FrameWaiters.DEFAULT_TIMEOUT_MS) {
    return this.waiters.wait(type, timeoutMs);
  }

  async hello({ agent, conversationId, approval }) {
    const mode = approval || this.approvalMode;
    this._sendHello(agent, conversationId, mode);
    let ready = await this.wait('ready');
    if (this._wasPromptNotAgent(ready, agent, conversationId)) {
      this.opts.prompt = `${agent} ${this.opts.prompt || ''}`.trim();
      this.opts.agent = null;
      this._sendHello(null, null, mode);
      ready = await this.wait('ready');
    }
    if (!ready || ready.__error) {
      this.push(new ErrorBlock((ready && ready.__error && ready.__error.message) || 'no answer from LumaBrowser'));
      this.exitCode = 1;
      return null;
    }
    this._adoptReady(ready, mode);
    return ready;
  }

  onFrame(type, payload) {
    if (this.waiters.deliver(type, payload) && !this.streaming) return;
    this.frames.handle(type, payload || {});
    this.requestRender();
  }

  onKey(k) {
    this.keys.handle(k);
  }

  toggleReasoning() {
    this.showReasoning = !this.showReasoning;
    if (this.reasoning) this.reasoning.shown = this.showReasoning;
    if (!this.reasoning || this.reasoning.done) this.push(new NoteBlock(`thinking ${this.showReasoning ? 'shown' : 'hidden'}`));
    this.requestRender();
  }

  get thinkingPreview() {
    const r = this.reasoning;
    return r && !r.done && !r.shown && r.text.trim() ? r : null;
  }

  beginTurn(text) {
    this.streaming = true;
    this.stopping = false;
    this.turnStartedAt = this.now();
    this.exitCode = 0;
    this.rollback.reset();
    this.answer = null;
    this.reasoning = null;
    this.turnStatus.since = 0;
    this.turnStatus.set({ kind: 'working' });
    this.editor.busy = true;
    this.editor.setSuggestion('');
    this.push(new UserBlock(text));
    this._startSpinner();
  }

  endTurn(commitAll) {
    this.streaming = false;
    this.stopping = false;
    this.turnStatus.reset();
    this.pendingTool = null;
    this.approval = null;
    this.editor.busy = false;
    this._stopSpinner();
    if (commitAll) for (const b of this.blocks) b.done = true;
    this.requestRender();
  }

  submit(text) {
    const t = String(text || '').trim();
    if (!t) return;
    this.editor.pushHistory(t);
    this.editor.clear();
    if (t.startsWith('/')) { this.command(t); return; }
    if (this.streaming) { this.send('followup', { text: t }); this.requestRender(); return; }
    this.beginTurn(t);
    this.send('prompt', { text: t });
    this.requestRender();
  }

  abort() {
    if (!this.streaming) return;
    this.send('abort');
    this.stopping = true;
    this.turnStatus.set({ text: 'stopping' });
    this.requestRender();
  }

  push(block) {
    this.blocks.push(block);
    this.requestRender();
  }

  askApproval(p) {
    this.turnStatus.clear();
    this.lastApprovalParams = p.params || null;
    this.approval = { tool: p.tool, detail: p.detail || `Run ${p.tool}`, params: p.params, idx: 0 };
    this.requestRender();
  }

  decide(decision) {
    if (!this.approval) return;
    this.send('approve', { decision });
    this.approval = null;
    this.requestRender();
  }

  quit() {
    if (this.streaming) this.send('abort');
    this.finish();
  }

  complete(prefix) {
    return this.commands.complete(prefix);
  }

  command(line) {
    return this.commands.run(line);
  }

  fetchAgents() {
    return this.commands.fetchAgents();
  }

  header(ready, note) {
    this.blocks.push(this._headerBlock(ready, note));
    if (!this.agents) {
      this.send('list-agents');
      this.wait('agents', 8000).then((p) => { if (p && !p.__error) this.agents = p.agents || []; });
    }
  }

  requestRender() {
    if (this.closed || this.renderTimer) return;
    this.renderTimer = setTimeout(() => { this.renderTimer = null; this.render(); }, App.RENDER_MS);
  }

  render() {
    this.view.render();
  }

  spinner() {
    const frames = this.theme.glyph.spinner;
    return frames[this.spinnerIdx % frames.length];
  }

  _initState(opts) {
    this.blocks = [];
    this.committed = [];
    this.fullRepaint = false;
    this.resizeTimer = null;
    this.suggest = opts.suggest !== false;
    this.streaming = false;
    this.turnStartedAt = 0;
    this.turnStatus = new TurnStatus(this.now);
    this.pendingTool = null;
    this.approval = null;
    this.spinnerIdx = 0;
    this.spinnerTimer = null;
    this.renderTimer = null;
    this.quitArmed = 0;
    this.exitCode = 0;
    this.closed = false;
    this.agents = null;
    this.agentName = null;
    this.model = null;
    this.conversationId = null;
    this.cwd = opts.cwd;
    this.lastUsage = null;
    this.contextWindow = null;
    this.answer = null;
    this.reasoning = null;
    this.showReasoning = !!opts.showReasoning;
    this.approvalMode = opts.yes ? 'never' : 'ask';
    this.rollback = new RollbackBuffer((t) => this.frames.appendAnswer(t));
    this.waiters = new FrameWaiters();
    this.followupsQueued = 0;
    this.stopping = false;
    this._done = null;
  }

  _attach() {
    this.term.start();
    this.term.on('key', (k) => this.onKey(k));
    this.term.on('resize', () => this.onResize());
    this.link.onFrame((type, payload) => this.onFrame(type, payload));
    if (this.link.onClose) this.link.onClose(() => this.onLinkClosed());
  }

  _applyScheme(scheme) {
    if (!scheme || scheme === this.theme.scheme) return;
    this.theme = new Theme({ depth: this.theme.depth, scheme, ascii: this.theme.ascii });
    this.editor.theme = this.theme;
  }

  _sendHello(agent, conversationId, approval) {
    this.send('hello', { cwd: this.cwd, agent: agent || null, conversationId: conversationId || null, approval, suggest: this.suggest });
  }

  _wasPromptNotAgent(ready, agent, conversationId) {
    return !!(ready && ready.__error && ready.__error.code === 'no-agent' && agent && !conversationId && this.opts.agentIsGuess);
  }

  _adoptReady(ready, mode) {
    this.conversationId = ready.conversationId;
    this.agentName = ready.agent ? ready.agent.name : null;
    this.model = ready.model || null;
    this.approvalMode = ready.approval || mode;
    this.editor.label = this.agentName || '';
  }

  _headerBlock(ready, note) {
    const t = this.theme;
    const g = t.glyph;
    const who = ready.agent ? ready.agent.name : 'Code';
    const bits = [];
    if (ready.model) bits.push(ready.model);
    if (ready.resumedMessages) bits.push(`${ready.resumedMessages} messages resumed`);
    if (this.approvalMode === 'never') bits.push('approvals off');
    return new HeaderBlock({
      title: `${t.fg('accent', g.artifact)} ${t.bold(t.fg('text', 'LumaBrowser'))}  ${t.fg('accent', who)}`,
      sub: [t.fg('muted', HomePath.tildify(this.cwd)), t.fg('muted', bits.join(` ${g.dot} `))],
      hint: note ? t.fg('warn', note) : t.fg('muted', `/ for commands ${g.dot} esc stops a turn ${g.dot} ctrl+j for a new line`),
    });
  }

  _startSpinner() {
    if (this.spinnerTimer) return;
    this.spinnerTimer = setInterval(() => {
      this.spinnerIdx = (this.spinnerIdx + 1) % this.theme.glyph.spinner.length;
      this.requestRender();
    }, App.SPINNER_MS);
    if (this.spinnerTimer.unref) this.spinnerTimer.unref();
  }

  _stopSpinner() {
    if (this.spinnerTimer) { clearInterval(this.spinnerTimer); this.spinnerTimer = null; }
  }

  _stopTimers() {
    this._stopSpinner();
    if (this.resizeTimer) { clearTimeout(this.resizeTimer); this.resizeTimer = null; }
    if (this.renderTimer) { clearTimeout(this.renderTimer); this.renderTimer = null; }
  }
}

module.exports = App;
