import HtmlEscaper from '../format/HtmlEscaper.js';
import ReadmeVault from './ReadmeVault.js';

export default class ReadmeBlocks {
  static LIST_ITEM = /^\s*([-*+]|\d+\.)\s+(.*)$/;

  static TABLE_SEPARATOR = /^\s*\|?[\s:|-]+\|[\s:|-]*$/;

  static PARAGRAPH_BREAK = /^\s*(#{1,6}\s|```|>\s?|[-*+]\s|\d+\.\s)/;

  constructor(inline) {
    this._inline = inline;
  }

  render(source) {
    this._lines = source.split('\n');
    this._i = 0;
    this._out = [];
    while (this._i < this._lines.length) this._renderNext();
    return this._out.join('\n');
  }

  _renderNext() {
    const line = this._lines[this._i];
    if (this._vaulted(line) || this._fence(line) || this._table(line) || this._heading(line)
      || this._rule(line) || this._quote(line) || this._list(line)) return;
    if (!line.trim()) { this._i++; return; }
    this._paragraph(line);
  }

  _vaulted(line) {
    if (!ReadmeVault.isTokenLine(line.trim())) return false;
    this._out.push(line.trim());
    this._i++;
    return true;
  }

  _fence(line) {
    if (!/^\s*```/.test(line)) return false;
    const buf = [];
    this._i++;
    while (this._i < this._lines.length && !/^\s*```/.test(this._lines[this._i])) { buf.push(this._lines[this._i]); this._i++; }
    this._i++;
    this._out.push(`<pre class="ms-pre"><code>${HtmlEscaper.escapeKeepingApostrophes(buf.join('\n'))}</code></pre>`);
    return true;
  }

  _table(line) {
    const next = this._lines[this._i + 1];
    if (!/\|/.test(line) || next === undefined || !ReadmeBlocks.TABLE_SEPARATOR.test(next)) return false;
    const head = ReadmeBlocks._cellsOf(line);
    this._i += 2;
    const rows = [];
    while (this._i < this._lines.length && /\|/.test(this._lines[this._i]) && this._lines[this._i].trim()) {
      rows.push(ReadmeBlocks._cellsOf(this._lines[this._i]));
      this._i++;
    }
    const th = head.map((c) => `<th>${this._inline.render(c)}</th>`).join('');
    const trs = rows.map((r) => `<tr>${r.map((c) => `<td>${this._inline.render(c)}</td>`).join('')}</tr>`).join('');
    this._out.push(`<table class="ms-table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`);
    return true;
  }

  static _cellsOf(row) {
    return row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  }

  _heading(line) {
    const match = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!match) return false;
    const level = Math.min(6, match[1].length);
    this._out.push(`<h${level} class="ms-h">${this._inline.render(match[2])}</h${level}>`);
    this._i++;
    return true;
  }

  _rule(line) {
    if (!/^\s*([-*_])\s*\1\s*\1[\s\1]*$/.test(line)) return false;
    this._out.push('<hr class="ms-hr">');
    this._i++;
    return true;
  }

  _quote(line) {
    if (!/^\s*>\s?/.test(line)) return false;
    const buf = [];
    while (this._i < this._lines.length && /^\s*>\s?/.test(this._lines[this._i])) {
      buf.push(this._lines[this._i].replace(/^\s*>\s?/, ''));
      this._i++;
    }
    this._out.push(`<blockquote class="ms-quote">${this._inline.render(buf.join(' '))}</blockquote>`);
    return true;
  }

  _list(line) {
    const first = ReadmeBlocks.LIST_ITEM.exec(line);
    if (!first) return false;
    const tag = /\d/.test(first[1]) ? 'ol' : 'ul';
    const items = [];
    while (this._i < this._lines.length) {
      const match = ReadmeBlocks.LIST_ITEM.exec(this._lines[this._i]);
      if (!match) break;
      items.push(`<li>${this._inline.render(match[2])}</li>`);
      this._i++;
    }
    this._out.push(`<${tag} class="ms-list">${items.join('')}</${tag}>`);
    return true;
  }

  _paragraph(line) {
    const buf = [line];
    this._i++;
    while (this._i < this._lines.length && this._lines[this._i].trim()
      && !ReadmeBlocks.PARAGRAPH_BREAK.test(this._lines[this._i]) && !/\|/.test(this._lines[this._i])) {
      buf.push(this._lines[this._i]);
      this._i++;
    }
    this._out.push(`<p class="ms-p">${this._inline.render(buf.join(' '))}</p>`);
  }
}
