import HtmlEscaper from '../format/HtmlEscaper.js';
import ChartWidget from './ChartWidget.js';
import CodeHighlighter from './CodeHighlighter.js';
import MarkdownBlocks from './MarkdownBlocks.js';
import StatsWidget from './StatsWidget.js';
import StreamingMarkdown from './StreamingMarkdown.js';

export default class MarkdownRenderer {
  static FENCE_RE = /```([\w+-]*)\n?([\s\S]*?)```/g;

  static WIDGETS = { chart: ChartWidget, stats: StatsWidget };

  static PENDING = { chart: 'Drawing a chart…', stats: 'Gathering numbers…' };

  static WIDGET_RE = /^<(div|figure) class="cm-widget/;

  static TABLE_RE = /^\|(.+)\|[ \t]*\n\|[ \t:|-]+\|[ \t]*\n((?:\|.*\|[ \t]*\n?)*)/gm;

  static render(md, opts) {
    if (!md) return '';
    const fences = [];
    const text = opts && opts.streaming ? StreamingMarkdown.close(String(md)) : String(md);
    let html = MarkdownRenderer._parkFences(text, fences, !!(opts && opts.streaming));
    html = HtmlEscaper.escapeKeepingApostrophes(html);
    html = MarkdownRenderer._tables(html);
    html = new MarkdownBlocks().render(html);
    return MarkdownRenderer._restoreFences(html, fences);
  }

  static _parkFences(text, fences, streaming) {
    return text.replace(MarkdownRenderer.FENCE_RE, (_, lang, code) => {
      const index = fences.length;
      const kind = String(lang).toLowerCase();
      const widget = MarkdownRenderer.WIDGETS[kind];
      const html = widget ? widget.html(code) : null;
      if (html) fences.push(html);
      else if (widget && streaming) fences.push('<div class="cm-widget cm-widget-pending">' + MarkdownRenderer.PENDING[kind] + '</div>');
      else fences.push('<pre><code>' + CodeHighlighter.highlight(code.replace(/\n$/, '')) + '</code></pre>');
      return '\n@@FENCE' + index + '@@\n';
    });
  }

  static _tables(escaped) {
    return escaped.replace(MarkdownRenderer.TABLE_RE, (_, head, body) => {
      const th = head.split('|').map((cell) => '<th>' + cell.trim() + '</th>').join('');
      const tr = body.trim().split('\n').map((row) => '<tr>' + MarkdownRenderer._rowCells(row) + '</tr>').join('');
      return '<table><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table>';
    });
  }

  static _rowCells(row) {
    return row.replace(/^\||\|$/g, '').split('|').map((cell) => '<td>' + cell.trim() + '</td>').join('');
  }

  static _restoreFences(html, fences) {
    return html
      .replace(/<p>\s*@@FENCE(\d+)@@\s*<\/p>/g, (_, i) => fences[Number(i)] || '')
      .replace(/(?:<br\/>)?@@FENCE(\d+)@@(?:<br\/>)?/g, (m, i) => {
        const f = fences[Number(i)] || '';
        return MarkdownRenderer.WIDGET_RE.test(f) ? f : m.replace('@@FENCE' + i + '@@', f);
      });
  }
}
