const Block = require('./Block');
const AnsiFit = require('../ansi/AnsiFit');
const ToolGrammar = require('../ToolGrammar');

const INDENT = Block.INDENT;

class ToolBlock extends Block {
  static MAX_OUTPUT_LINES = 400;
  static DIFF_CAP = 14;

  constructor({ tool, params }) {
    super();
    this.tool = tool || 'tool';
    this.params = params || null;
    this.success = null;
    this.error = null;
    this.summary = null;
    this.output = [];
    this.outputTail = '';
    this.startedAt = Date.now();
    this.endedAt = 0;
    this.decision = null;
    this.expanded = false;
  }

  finish({ success, error, summary }) {
    this.done = true;
    this.success = success !== false;
    this.error = error || null;
    this.summary = summary || null;
    this.endedAt = Date.now();
    if (this.outputTail) { this.output.push(this.outputTail); this.outputTail = ''; }
  }

  appendOutput(chunk) {
    const parts = (this.outputTail + String(chunk || '')).split(/\r?\n/);
    this.outputTail = parts.pop();
    for (const p of parts) this.output.push(p);
    if (this.output.length > ToolBlock.MAX_OUTPUT_LINES) this.output.splice(0, this.output.length - ToolBlock.MAX_OUTPUT_LINES);
  }

  elapsed() {
    return ((this.endedAt || Date.now()) - this.startedAt) / 1000;
  }

  render(width, t, { spinner = '' } = {}) {
    const out = [AnsiFit.truncate(this._titleLine(t, spinner), width)];
    const bodyW = Math.max(8, width - INDENT.length - 4);
    if (this.tool === 'run_command') this._commandTail(t, bodyW, out);
    else if (this._hasDiff()) this._diff(t, bodyW, out);
    return out.map((l) => AnsiFit.truncate(l, width));
  }

  get _failed() { return this.done && !this.success; }

  get _denied() { return this.decision === 'reject'; }

  _titleLine(t, spinner) {
    const titleColor = this._denied ? 'muted' : this._failed ? 'bad' : this.done ? 'dim' : 'text';
    const line = `${INDENT}${this._glyph(t, spinner)} ${t.fg(titleColor, this._title(t.glyph))}`;
    const tail = this._tail();
    if (!tail.length) return line;
    return `${line} ${t.fg(this._failed ? 'bad' : 'muted', `${t.glyph.dot} ${tail.join(` ${t.glyph.dot} `)}`)}`;
  }

  _glyph(t, spinner) {
    const g = t.glyph;
    if (this._denied) return t.fg('muted', g.fail);
    if (!this.done) return t.fg('accent', spinner || g.running);
    return this._failed ? t.fg('bad', g.fail) : t.fg('good', g.ok);
  }

  _title(g) {
    const st = ToolGrammar.toolStyle(this.tool);
    const detail = ToolGrammar.toolDetail(this.tool, this.params);
    if (this.tool === 'run_command') return `${g.shell} ${detail}`;
    const verb = st.verb ? `${st.verb} ` : `${g[st.glyph] || ''} `;
    return `${verb}${detail}`.trim() || this.tool;
  }

  _tail() {
    const tail = [];
    if (this._denied) tail.push('denied');
    else if (this.decision === 'run') tail.push('allowed for this run');
    if (this.done) {
      const summary = ToolGrammar.trimSummary(this.tool, this.params, this.summary);
      if (summary) tail.push(ToolGrammar.short(summary, 90));
      if (this._failed && this.error) tail.push(ToolGrammar.short(this.error, 120));
      if (this.tool === 'run_command') tail.push(`${this.elapsed().toFixed(1)}s`);
    } else if (this.tool === 'run_command' && this.elapsed() >= 2) {
      tail.push(`${Math.floor(this.elapsed())}s`);
    }
    return tail;
  }

  _commandTail(t, bodyW, out) {
    const g = t.glyph;
    const bar = t.fg('border', g.vline);
    const all = this.outputTail ? [...this.output, this.outputTail] : this.output;
    const cap = this.done ? (this._failed ? 12 : 6) : 8;
    const shown = all.slice(-cap);
    const hidden = all.length - shown.length;
    if (hidden > 0) out.push(`${INDENT}  ${bar} ${t.fg('muted', `${g.ellipsis} ${hidden} earlier line${hidden === 1 ? '' : 's'}`)}`);
    for (const l of shown) out.push(`${INDENT}  ${bar} ${t.fg('muted', AnsiFit.truncate(l.replace(/\t/g, '  '), bodyW))}`);
  }

  _hasDiff() {
    return this.tool === 'edit_file' && this.params && Array.isArray(this.params.edits) && !this._denied;
  }

  _diff(t, bodyW, out) {
    const g = t.glyph;
    const bar = t.fg('border', g.vline);
    const diff = [];
    for (const e of this.params.edits) {
      if (!e) continue;
      for (const l of String(e.oldText || '').split('\n')) diff.push(t.fg('diffDel', AnsiFit.truncate(`- ${l}`, bodyW)));
      for (const l of String(e.newText || '').split('\n')) diff.push(t.fg('diffAdd', AnsiFit.truncate(`+ ${l}`, bodyW)));
    }
    const cap = ToolBlock.DIFF_CAP;
    for (const l of diff.slice(0, cap)) out.push(`${INDENT}  ${bar} ${l}`);
    const more = diff.length - cap;
    if (more > 0) out.push(`${INDENT}  ${bar} ${t.fg('muted', `${g.ellipsis} ${more} more line${more === 1 ? '' : 's'}`)}`);
  }
}

module.exports = ToolBlock;
