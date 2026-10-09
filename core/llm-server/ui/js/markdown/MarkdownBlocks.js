import MarkdownInline from './MarkdownInline.js';

export default class MarkdownBlocks {
  constructor() {
    this._html = [];
    this._listType = null;
  }

  render(escaped) {
    for (const line of escaped.split('\n')) this._addLine(line);
    this._closeList();
    return this._html.join('\n').replace(/<\/p>\n*<p>/g, '<br/>');
  }

  _addLine(line) {
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      this._block('<h' + m[1].length + '>' + MarkdownInline.render(m[2]) + '</h' + m[1].length + '>');
    } else if (/^\s*([-*_])\1\1+\s*$/.test(line)) {
      this._block('<hr/>');
    } else if ((m = line.match(/^\s*>\s?(.*)$/))) {
      this._block('<blockquote>' + MarkdownInline.render(m[1]) + '</blockquote>');
    } else if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
      this._listItem('ul', m[1]);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      this._listItem('ol', m[1]);
    } else if (/^\s*$/.test(line)) {
      this._block('');
    } else {
      this._block('<p>' + MarkdownInline.render(line) + '</p>');
    }
  }

  _block(html) {
    this._closeList();
    this._html.push(html);
  }

  _listItem(type, text) {
    if (this._listType !== type) {
      this._closeList();
      this._html.push('<' + type + '>');
      this._listType = type;
    }
    this._html.push('<li>' + MarkdownInline.render(text) + '</li>');
  }

  _closeList() {
    if (!this._listType) return;
    this._html.push('</' + this._listType + '>');
    this._listType = null;
  }
}
