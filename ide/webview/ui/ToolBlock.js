import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import PageDom from './PageDom.js';
import PageIcons from './PageIcons.js';

export default class ToolBlock {
  static MAX_OUTPUT_LINES = 400;
  static LIVE_OUTPUT_LINES = 12;
  static DONE_OUTPUT_LINES = 60;
  static DIFF_LINES = 24;

  constructor({ transcript, host, grammar, tool, params }) {
    this._transcript = transcript;
    this._host = host;
    this._grammar = grammar;
    this.tool = tool;
    this.params = params;
    this.path = grammar.toolPath(tool, params);
    this.done = false;
    this.decision = null;
    this.startedAt = Date.now();
    this._output = [];
    this._outputTail = '';
    this._build();
    this._paintTitle();
    this._showDiff();
  }

  appendOutput(chunk) {
    const parts = (this._outputTail + String(chunk || '')).split(/\r?\n/);
    this._outputTail = parts.pop();
    for (const p of parts) this._output.push(p);
    if (this._output.length > ToolBlock.MAX_OUTPUT_LINES) this._output.splice(0, this._output.length - ToolBlock.MAX_OUTPUT_LINES);
    this._paintOutput();
  }

  finish({ success, error, summary }) {
    this.done = true;
    const failed = success === false;
    const denied = this.decision === 'reject';
    this._paintOutcome(failed, denied);
    this._summary.textContent = this._summaryText({ failed, denied, error, summary });
    if (this._outputTail) { this._output.push(this._outputTail); this._outputTail = ''; }
    this._paintOutput();
    if (!denied && !failed && this.path && this._grammar.MUTATING_FILE_TOOLS.indexOf(this.tool) !== -1) this._addDiffButton();
    this._transcript.autoscroll();
  }

  _build() {
    this.node = this._transcript.push(PageDom.div('block tool run'));
    const row = PageDom.div('row');
    this._glyph = PageDom.div('g', '<span class="spin"></span>');
    this._title = PageDom.div('t');
    this._summary = PageDom.div('s');
    this._actions = PageDom.div('act');
    row.append(this._glyph, this._title, this._summary, this._actions);
    this.node.appendChild(row);
    this._body = PageDom.div('body');
    this._body.hidden = true;
    this.node.appendChild(this._body);
  }

  _paintTitle() {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const detail = this._grammar.toolDetail(this.tool, this.params);
    const verb = this.tool === 'run_command' ? '$' : (this._grammar.toolStyle(this.tool).verb || this.tool.replace(/_/g, ' '));
    if (!this.path) {
      this._title.innerHTML = '<b>' + esc(verb) + '</b> <span class="d">' + esc(detail) + '</span>';
      return;
    }
    this._title.innerHTML = '<b>' + esc(verb) + '</b> <a class="file d" data-path="' + esc(this.path) + '">' + esc(detail) + '</a>';
    const path = this.path;
    this._title.querySelector('a.file').addEventListener('click', () => this._host.send('openFile', { path }));
  }

  _paintOutput() {
    const lines = this._outputTail ? [...this._output, this._outputTail] : this._output;
    if (!lines.length) return;
    this._body.hidden = false;
    const shown = lines.slice(-(this.done ? ToolBlock.DONE_OUTPUT_LINES : ToolBlock.LIVE_OUTPUT_LINES));
    this._body.textContent = shown.join('\n');
    if (lines.length > shown.length) this._body.insertAdjacentHTML('afterbegin', '<span class="more">… ' + (lines.length - shown.length) + ' earlier lines</span>');
    this._body.scrollTop = this._body.scrollHeight;
    this._transcript.autoscroll();
  }

  _showDiff() {
    const p = this.params || {};
    if (this.tool !== 'edit_file' || !Array.isArray(p.edits) || this.decision === 'reject') return;
    const lines = ToolBlock._diffLines(p.edits);
    if (!lines.length) return;
    this._body.className = 'body diff';
    this._body.hidden = false;
    const more = lines.length > ToolBlock.DIFF_LINES ? '<span class="more">… ' + (lines.length - ToolBlock.DIFF_LINES) + ' more lines</span>' : '';
    this._body.innerHTML = lines.slice(0, ToolBlock.DIFF_LINES).join('') + more;
  }

  static _diffLines(edits) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const lines = [];
    for (const e of edits) {
      if (!e) continue;
      for (const l of String(e.oldText || '').split('\n')) lines.push('<span class="del">- ' + esc(l) + '</span>');
      for (const l of String(e.newText || '').split('\n')) lines.push('<span class="add">+ ' + esc(l) + '</span>');
    }
    return lines;
  }

  _paintOutcome(failed, denied) {
    this.node.classList.remove('run');
    this.node.classList.add('done', denied ? 'denied' : failed ? 'err' : 'ok');
    this._glyph.innerHTML = denied || failed ? PageIcons.ICONS.fail : PageIcons.ICONS.ok;
  }

  _summaryText({ failed, denied, error, summary }) {
    const g = this._grammar;
    const tail = [];
    if (denied) tail.push('denied');
    else if (this.decision === 'run') tail.push('allowed for this run');
    const sum = g.trimSummary(this.tool, this.params, summary);
    if (sum) tail.push(g.short(sum, 90));
    if (failed && error) tail.push(g.short(error, 140));
    if (this.tool === 'run_command') tail.push(((Date.now() - this.startedAt) / 1000).toFixed(1) + 's');
    return tail.length ? '· ' + tail.join(' · ') : '';
  }

  _addDiffButton() {
    const diff = document.createElement('button');
    diff.textContent = 'diff';
    diff.title = 'Compare with the file before this edit';
    const path = this.path;
    diff.addEventListener('click', () => this._host.send('showDiff', { path }));
    this._actions.appendChild(diff);
  }
}
