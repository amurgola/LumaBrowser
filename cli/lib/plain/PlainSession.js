const path = require('path');
const readline = require('readline');
const AnsiCodes = require('./AnsiCodes');
const AgentList = require('./AgentList');
const BridgeLink = require('../BridgeLink');
const FrameWaiters = require('../FrameWaiters');

const C = AnsiCodes;

class PlainSession {
  static INTERRUPTS_TO_QUIT = 2;

  constructor({ ws, renderer, opts, stdin = process.stdin, stdout = process.stdout, stderr = process.stderr }) {
    this.ws = ws;
    this.r = renderer;
    this.opts = opts;
    this.stdin = stdin;
    this.stdout = stdout;
    this.stderr = stderr;
    this.rl = null;
    this.waiters = new FrameWaiters();
    this.turnDone = null;
    this.exitCode = 0;
    this.streaming = false;
    this.interrupts = 0;
    this.pendingApproval = false;
    this.conversationId = null;
    this.closedByPeer = false;
    ws.on('message', (raw) => this.onFrame(raw));
    ws.on('close', () => this.onClose());
  }

  send(type, payload) {
    this.ws.sendJson({ type, payload: payload || {} });
  }

  wait(type, timeoutMs) {
    return this.waiters.wait(type, timeoutMs);
  }

  onFrame(raw) {
    const frame = BridgeLink.parse(raw);
    if (!frame) return;
    const { type, payload } = frame;
    this.waiters.deliver(type, payload);
    if (type === 'meta' && payload && payload.conversationId) this.conversationId = payload.conversationId;
    if (type === 'tool' && payload && payload.phase === 'approval' && this.r.mode !== 'json') {
      this.r.frame(type, payload);
      this.askApproval();
      return;
    }
    this._endTurnIf(this.r.frame(type, payload), payload);
  }

  onClose() {
    this._releaseTurn();
    if (this.rl) this.rl.close();
    if (this.streaming) {
      this.stderr.write('luma: connection closed mid-turn\n');
      this.exitCode = this.exitCode || 1;
    }
    this.closedByPeer = true;
  }

  async run() {
    if (this.opts.agents) return this._listAgents();
    const ready = await this._open();
    if (!ready) return this._close(1);
    this.conversationId = ready.conversationId;
    if (this.r.mode === 'interactive') this._greet(ready);
    const first = this.opts.prompt.join(' ').trim();
    const oneShot = this.r.mode !== 'interactive';
    if (first) await this.turn(first);
    else if (oneShot) { this.stderr.write('luma: a prompt is required with -p / --json\n'); return this._close(1); }
    if (!oneShot) await this.loop();
    return this._close(this.exitCode);
  }

  turn(text) {
    this.streaming = true;
    this.exitCode = 0;
    this.r.turnStart();
    return new Promise((resolve) => {
      this.turnDone = resolve;
      this.send('prompt', { text });
    });
  }

  async loop() {
    this.rl = readline.createInterface({ input: this.stdin, output: this.stderr, terminal: !!this.stdin.isTTY });
    this.rl.on('SIGINT', () => this._onInterrupt());
    await new Promise((resolve) => {
      this.rl.on('close', resolve);
      this.rl.on('line', (line) => this._onLine(line));
      this._prompt();
    });
  }

  askApproval() {
    this.pendingApproval = true;
    const q = `${this.r.c(C.yellow, '  allow?')} ${this.r.c(C.dim, '[y]es once · [a]ll this run · [n]o')} `;
    const answer = (s) => this._answerApproval(s);
    if (this.rl) {
      this.rl.question(q, answer);
    } else if (this.stdin.isTTY) {
      const rl = readline.createInterface({ input: this.stdin, output: this.stderr });
      rl.question(q, (s) => { rl.close(); answer(s); });
    } else {
      this.stderr.write(`${this.r.c(C.yellow, '  denied:')} no terminal to ask (pass --yes to allow mutating tools unattended)\n`);
      answer('n');
    }
  }

  static decisionFor(reply) {
    const t = String(reply || '').trim().toLowerCase();
    if (t === 'y' || t === 'yes') return 'once';
    if (t === 'a' || t === 'all') return 'run';
    return 'reject';
  }

  _answerApproval(reply) {
    this.send('approve', { decision: PlainSession.decisionFor(reply) });
    this.pendingApproval = false;
  }

  _endTurnIf(terminal, payload) {
    if (!terminal) return;
    this.streaming = false;
    if (terminal === 'error') this.exitCode = 1;
    else if (payload && payload.aborted) this.exitCode = 2;
    this._releaseTurn();
  }

  _releaseTurn() {
    if (!this.turnDone) return;
    const done = this.turnDone;
    this.turnDone = null;
    done();
  }

  async _listAgents() {
    this.send('list-agents');
    const p = await this.wait('agents');
    if (p && p.__error) { this.stderr.write(`luma: ${p.__error.message}\n`); return this._close(1); }
    AgentList.print(p, this.r, this.stdout);
    return this._close(0);
  }

  async _open() {
    const o = this.opts;
    let ready = await this._hello(o.agent === '.' ? null : o.agent);
    if (ready && ready.__error && ready.__error.code === 'no-agent' && o.agent !== '.') {
      o.prompt.unshift(o.agent);
      o.agent = '.';
      ready = await this._hello(null);
    }
    if (ready && !ready.__error) return ready;
    this.stderr.write(`luma: ${(ready && ready.__error && ready.__error.message) || 'no answer from LumaBrowser'}\n`);
    return null;
  }

  _hello(agent) {
    const o = this.opts;
    this.send('hello', { cwd: this._cwd(), agent, conversationId: o.resume || null, approval: o.yes ? 'never' : 'ask' });
    return this.wait('ready');
  }

  _cwd() {
    return path.resolve(this.opts.cwd || process.cwd());
  }

  _greet(ready) {
    const who = ready.agent ? ready.agent.name : 'Code';
    const bits = [`model ${ready.model}`, ready.resumedMessages ? `${ready.resumedMessages} messages resumed` : null, this.opts.yes ? 'approvals off' : null].filter(Boolean);
    this.stderr.write(`${this.r.c(C.bold, who)} ${this.r.c(C.dim, `in ${this._cwd()} · ${bits.join(' · ')}`)}\n`);
    this.stderr.write(`${this.r.c(C.dim, 'Type what you want done here. /agents lists agents, /quit leaves, Ctrl+C stops a turn.')}\n`);
  }

  _close(code) {
    this.ws.close();
    return code;
  }

  _prompt() {
    if (this.closedByPeer) return;
    this.rl.setPrompt(`${this.r.c(C.cyan, '›')} `);
    this.rl.prompt();
  }

  _onInterrupt() {
    if (this.pendingApproval) return;
    if (!this.streaming) { this.rl.close(); return; }
    this.interrupts += 1;
    this.send('abort');
    if (this.interrupts >= PlainSession.INTERRUPTS_TO_QUIT) this.rl.close();
  }

  async _onLine(line) {
    const text = line.trim();
    if (this.pendingApproval) return;
    if (!text) { this._prompt(); return; }
    if (text === '/quit' || text === '/exit') { this.rl.close(); return; }
    if (text === '/id') { this.stderr.write(`${this.conversationId}\n`); this._prompt(); return; }
    if (text === '/agents') { await this._printAgents(); this._prompt(); return; }
    if (this.streaming) { this.send('followup', { text }); return; }
    this.interrupts = 0;
    await this.turn(text);
    this._prompt();
  }

  async _printAgents() {
    this.send('list-agents');
    const p = await this.wait('agents');
    if (p && !p.__error) AgentList.print(p, this.r, this.stdout);
  }
}

module.exports = PlainSession;
