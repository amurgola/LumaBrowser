const AnsiWrap = require('../ansi/AnsiWrap');
const CellWidth = require('../ansi/CellWidth');
const MarkdownInline = require('./MarkdownInline');
const MarkdownTable = require('./MarkdownTable');

class MarkdownRenderer {
  static FENCE = /^(\s{0,3})(`{3,}|~{3,})\s*([^\s`]*)\s*$/;
  static HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
  static BULLET = /^(\s*)([-*+])\s+(.*)$/;
  static ORDERED = /^(\s*)(\d{1,3})[.)]\s+(.*)$/;
  static RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
  static QUOTE = /^\s{0,3}>\s?(.*)$/;
  static TABLE_ROW = /^\s*\|.*\|\s*$/;
  static TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
  static TASK = /^\[( |x|X)\]\s+(.*)$/;
  static INDENTED_CODE = /^ {4}|^\t/;

  static render(md, width, t) {
    return new MarkdownRenderer(md, width, t)._run();
  }

  constructor(md, width, t) {
    this.src = String(md == null ? '' : md).replace(/\r\n?/g, '\n').split('\n');
    this.width = width;
    this.t = t;
    this.g = t.glyph;
    this.out = [];
    this.para = [];
    this.i = 0;
  }

  _run() {
    while (this.i < this.src.length) this._block(this.src[this.i]);
    this._flushPara();
    while (this.out.length && this.out[this.out.length - 1] === '') this.out.pop();
    while (this.out.length && this.out[0] === '') this.out.shift();
    return this.out;
  }

  _block(line) {
    const R = MarkdownRenderer;
    const f = R.FENCE.exec(line);
    if (f) return this._fence(f);
    if (!line.trim()) { this._flushPara(); this._blank(); this.i++; return undefined; }
    const h = R.HEADING.exec(line);
    if (h) return this._heading(h);
    if (R.RULE.test(line)) return this._rule();
    if (R.QUOTE.test(line)) return this._quote();
    if (R.TABLE_ROW.test(line) && this.i + 1 < this.src.length && R.TABLE_SEP.test(this.src[this.i + 1])) return this._table(line);
    const item = R.BULLET.exec(line) || R.ORDERED.exec(line);
    if (item) return this._listItem(item, !!R.BULLET.exec(line));
    if (R.INDENTED_CODE.test(line) && !this.para.length) return this._indentedCode();
    this.para.push(line);
    this.i++;
    return undefined;
  }

  _flushPara() {
    if (!this.para.length) return;
    const text = this.para.join(' ').replace(/\s+/g, ' ').trim();
    if (text) for (const l of AnsiWrap.wrap(MarkdownInline.render(text, this.t), this.width)) this.out.push(l);
    this.para = [];
  }

  _blank() {
    if (this.out.length && this.out[this.out.length - 1] !== '') this.out.push('');
  }

  _fence(f) {
    this._flushPara();
    const fence = f[2];
    const lang = f[3];
    const body = [];
    this.i++;
    while (this.i < this.src.length && !MarkdownRenderer._closesFence(this.src[this.i], fence)) { body.push(this.src[this.i]); this.i++; }
    if (this.i < this.src.length) this.i++;
    this._blank();
    const { t, g } = this;
    const unicode = g.corner === '╰';
    this.out.push(`${t.fg('border', unicode ? '╭' : ',')}${t.fg('border', g.rule)} ${t.fg('muted', lang || 'code')}`);
    for (const b of body) this._codeLine(b.replace(/\t/g, '   '));
    this.out.push(`${t.fg('border', unicode ? '╰' : '`')}${t.fg('border', g.rule)}`);
    this.out.push('');
  }

  static _closesFence(line, fence) {
    return line.trim().startsWith(fence[0].repeat(3)) && line.trim().replace(/[`~]/g, '') === '';
  }

  _codeLine(text) {
    const bar = this.t.fg('border', this.g.vline);
    for (const l of AnsiWrap.wrap(this.t.fg('text', text), Math.max(4, this.width - 2))) this.out.push(`${bar} ${l}`);
  }

  _heading(h) {
    this._flushPara();
    this._blank();
    const { t, g, width } = this;
    const level = h[1].length;
    const txt = MarkdownInline.render(h[2], t);
    const styled = level <= 2 ? t.bold(t.fg('accent', txt)) : t.bold(t.fg('text', txt));
    for (const l of AnsiWrap.wrap(styled, width)) this.out.push(l);
    if (level <= 2) this.out.push(t.fg('border', g.rule.repeat(Math.min(width, Math.max(8, CellWidth.visible(h[2]) + 2)))));
    this.i++;
  }

  _rule() {
    this._flushPara();
    this._blank();
    this.out.push(this.t.fg('border', this.g.rule.repeat(Math.min(this.width, 40))));
    this.out.push('');
    this.i++;
  }

  _quote() {
    this._flushPara();
    const q = [];
    while (this.i < this.src.length && MarkdownRenderer.QUOTE.test(this.src[this.i])) {
      q.push(MarkdownRenderer.QUOTE.exec(this.src[this.i])[1]);
      this.i++;
    }
    const bar = this.t.fg('accent', this.g.bar);
    for (const l of MarkdownRenderer.render(q.join('\n'), Math.max(4, this.width - 2), this.t)) this.out.push(`${bar} ${this.t.italic(l)}`);
  }

  _table(line) {
    this._flushPara();
    const rows = [line];
    this.i += 2;
    while (this.i < this.src.length && MarkdownRenderer.TABLE_ROW.test(this.src[this.i])) { rows.push(this.src[this.i]); this.i++; }
    for (const l of MarkdownTable.render(rows, this.width, this.t)) this.out.push(l);
  }

  _listItem(item, isBullet) {
    this._flushPara();
    const depth = Math.min(3, Math.floor(item[1].replace(/\t/g, '  ').length / 2));
    const pad = '  '.repeat(depth);
    const { marker, body } = this._marker(item, isBullet);
    this.i++;
    const text = [body, ...this._continuation()].join(' ');
    const mw = CellWidth.visible(marker) + 1;
    const wrapped = AnsiWrap.wrap(MarkdownInline.render(text, this.t), Math.max(4, this.width - pad.length - mw));
    wrapped.forEach((l, li) => this.out.push(li === 0 ? `${pad}${marker} ${l}` : `${pad}${' '.repeat(mw)}${l}`));
  }

  _marker(item, isBullet) {
    const t = this.t;
    if (!isBullet) return { marker: t.fg('accent', `${item[2]}.`), body: item[3] };
    const task = MarkdownRenderer.TASK.exec(item[3]);
    if (task) return { marker: task[1] === ' ' ? t.fg('muted', '[ ]') : t.fg('good', '[x]'), body: task[2] };
    return { marker: t.fg('accent', this.g.bullet), body: item[3] };
  }

  _continuation() {
    const R = MarkdownRenderer;
    const cont = [];
    while (this.i < this.src.length) {
      const s = this.src[this.i];
      if (!s.trim() || R.BULLET.test(s) || R.ORDERED.test(s) || R.FENCE.test(s) || R.HEADING.test(s) || !/^\s{2,}/.test(s)) break;
      cont.push(s.trim());
      this.i++;
    }
    return cont;
  }

  _indentedCode() {
    this._flushPara();
    const R = MarkdownRenderer;
    const body = [];
    while (this.i < this.src.length && (R.INDENTED_CODE.test(this.src[this.i]) || !this.src[this.i].trim())) {
      body.push(this.src[this.i].replace(R.INDENTED_CODE, ''));
      this.i++;
    }
    while (body.length && !body[body.length - 1].trim()) body.pop();
    for (const c of body) this._codeLine(c);
    this.out.push('');
  }
}

module.exports = MarkdownRenderer;
