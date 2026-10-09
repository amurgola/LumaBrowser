const AnsiCodes = require('./AnsiCodes');
const RollbackBuffer = require('../RollbackBuffer');
const ToolGrammar = require('../tui/ToolGrammar');

const C = AnsiCodes;

class PlainRenderer {
  static TERMINAL_FRAMES = ['done', 'error'];

  constructor({ mode, out, err, color, showReasoning } = {}) {
    this.mode = mode || 'interactive';
    this.out = out || process.stdout;
    this.err = err || process.stderr;
    this.color = color !== undefined ? !!color : !!(this.out.isTTY);
    this.showReasoning = !!showReasoning;
    this.answer = new RollbackBuffer((t) => this.out.write(t));
    this.statusLine = '';
    this.reasoningChars = 0;
    this.answerStarted = false;
    this.startedAt = 0;
  }

  c(code, s) {
    return this.color ? `${code}${s}${C.reset}` : s;
  }

  side(s) {
    (this.mode === 'print' ? this.err : this.out).write(s);
  }

  turnStart() {
    this.startedAt = Date.now();
    this.answer.reset();
    this.reasoningChars = 0;
    this.answerStarted = false;
  }

  frame(type, payload) {
    if (this.mode === 'json') this.out.write(`${JSON.stringify({ type, payload })}\n`);
    else this._paint(type, payload);
    return PlainRenderer.TERMINAL_FRAMES.includes(type) ? type : null;
  }

  _paint(type, p) {
    switch (type) {
      case 'status': return this._status(p);
      case 'delta': return this._delta(p);
      case 'reasoning-delta': return this._reasoning(p);
      case 'rollback': return this.answer.rollback(p && p.chars);
      case 'tool': return this._tool(p);
      case 'command:output': return this._commandOutput(p);
      case 'artifact': return this._card(`◆ ${p && p.title ? p.title : 'artifact'}${p && p.type ? ` (${p.type})` : ''}`);
      case 'done': return this._done(p);
      case 'error': return this._error(p);
      case 'queued': return this._card(this.c(C.dim, `queued (${p && p.pending} pending)`));
      case 'followup-start': return this.side(`\n${this.c(C.cyan, '›')} ${p && p.text}\n`);
      case 'busy': return this.side(`${this.c(C.yellow, '!')} ${p && p.message}\n`);
      case 'bridge-error': return this.side(`${this.c(C.red, 'bridge:')} ${p && p.message}\n`);
      default: return undefined;
    }
  }

  _clearStatus() {
    if (!this.statusLine) return;
    if (this.out.isTTY) this.side(`\r${' '.repeat(this.statusLine.length)}\r`);
    else this.side('\n');
    this.statusLine = '';
  }

  _showStatus(text) {
    this._clearStatus();
    this.statusLine = `  ${this.c(C.dim, `… ${text}`)}`;
    this.side(this.statusLine);
  }

  _status(p) {
    const phase = p && p.phase;
    this._showStatus(ToolGrammar.STATUS_TEXT[phase] || phase || 'working');
  }

  _delta(p) {
    const t = p && p.text;
    if (!t) return;
    if (!this.answerStarted) { this._clearStatus(); this.answerStarted = true; }
    this.answer.push(t);
  }

  _reasoning(p) {
    const t = p && p.text;
    if (!t) return;
    if (this.showReasoning) { this._clearStatus(); this.side(this.c(C.dim, t)); return; }
    this.reasoningChars += t.length;
    if (this.out.isTTY) this._showStatus(`thinking (${this.reasoningChars} chars)`);
  }

  _card(line) {
    this.answer.flush();
    this._clearStatus();
    if (this.answerStarted) { this.side('\n'); this.answerStarted = false; }
    this.side(`${line}\n`);
  }

  _tool(p) {
    if (!p || !p.phase) return;
    const name = p.tool || 'tool';
    if (p.phase === 'run') this._toolRun(name, p);
    else if (p.phase === 'done' || p.phase === 'result') this._toolDone(p);
    else if (p.phase === 'approval') this._card(`${this.c(C.yellow, '?')} ${p.detail || `${name} wants to run`}`);
    else if (p.phase === 'approval-done') this._card(`  ${this.c(C.dim, `approval: ${p.decision}`)}`);
  }

  _toolRun(name, p) {
    const detail = ToolGrammar.toolDetail(name, p.params);
    this._card(`${this.c(C.cyan, '▸')} ${this.c(C.bold, name)}${detail ? ` ${this.c(C.dim, detail)}` : ''}`);
  }

  _toolDone(p) {
    const ok = p.success !== false;
    const summary = p.summary || (ok ? 'ok' : (p.error || 'failed'));
    this._card(`  ${ok ? this.c(C.green, '✓') : this.c(C.red, '✗')} ${this.c(C.dim, String(summary).slice(0, 160))}`);
  }

  _commandOutput(p) {
    const chunk = p && p.chunk;
    if (!chunk) return;
    this._clearStatus();
    this.side(this.c(C.dim, chunk.replace(/\r?\n/g, '\n    ').replace(/^/, '    ')));
    if (!chunk.endsWith('\n')) this.side('\n');
  }

  _done(p) {
    this._endAnswer();
    this.side(`${this.c(C.dim, `▣ ${PlainRenderer._doneBits(p, this.startedAt).join(' · ') || 'done'}`)}\n`);
  }

  _error(p) {
    this._endAnswer();
    this.side(`${this.c(C.red, 'error:')} ${(p && p.message) || 'unknown error'}\n`);
  }

  _endAnswer() {
    this.answer.flush();
    this._clearStatus();
    if (this.answerStarted) this.out.write('\n');
  }

  static _doneBits(p, startedAt) {
    const bits = [];
    if (p && p.aborted) bits.push('stopped');
    if (p && p.iterations) bits.push(`${p.iterations} step${p.iterations === 1 ? '' : 's'}`);
    if (p && p.usage && p.usage.total_tokens) bits.push(`${p.usage.total_tokens} tokens`);
    if (startedAt) bits.push(`${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
    return bits;
  }
}

module.exports = PlainRenderer;
