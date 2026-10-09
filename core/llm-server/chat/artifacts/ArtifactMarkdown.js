const HtmlText = require('./HtmlText');

class ArtifactMarkdown {
  static FENCE = /```([\w+-]*)\n?([\s\S]*?)```/g;
  static TABLE = /^\|(.+)\|[ \t]*\n\|[ \t:|-]+\|[ \t]*\n((?:\|.*\|[ \t]*\n?)*)/gm;

  static toHtml(markdown) {
    if (!markdown) return '';
    const blocks = [];
    let text = ArtifactMarkdown._parkFences(String(markdown), blocks);
    text = ArtifactMarkdown._parkTables(HtmlText.escape(text), blocks);
    return ArtifactMarkdown._restoreBlocks(ArtifactMarkdown._renderLines(text), blocks);
  }

  static _parkFences(text, blocks) {
    return text.replace(ArtifactMarkdown.FENCE, (_, _lang, code) => {
      blocks.push('<pre class="cm-art-code"><code>' + HtmlText.escape(code.replace(/\n$/, '')) + '</code></pre>');
      return `\n@@F${blocks.length - 1}@@\n`;
    });
  }

  static _parkTables(text, blocks) {
    return text.replace(ArtifactMarkdown.TABLE, (_, head, body) => {
      blocks.push(`<table><thead><tr>${ArtifactMarkdown._headerCells(head)}</tr></thead><tbody>${ArtifactMarkdown._bodyRows(body)}</tbody></table>`);
      return `\n@@F${blocks.length - 1}@@\n`;
    });
  }

  static _headerCells(head) {
    return head.split('|').map((c) => '<th>' + c.trim() + '</th>').join('');
  }

  static _bodyRows(body) {
    return body.trim().split('\n').filter(Boolean).map((row) => {
      const cells = row.replace(/^\||\|[ \t]*$/g, '').split('|').map((c) => '<td>' + c.trim() + '</td>').join('');
      return '<tr>' + cells + '</tr>';
    }).join('');
  }

  static _renderLines(text) {
    const out = [];
    let list = null;
    const closeList = () => { if (list) { out.push('</' + list + '>'); list = null; } };
    const openList = (kind) => { if (list !== kind) { closeList(); out.push('<' + kind + '>'); list = kind; } };
    for (const line of text.split('\n')) {
      let m;
      if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { closeList(); out.push(`<h${m[1].length}>${ArtifactMarkdown._inline(m[2])}</h${m[1].length}>`); }
      else if (/^\s*([-*_])\1\1+\s*$/.test(line)) { closeList(); out.push('<hr/>'); }
      else if ((m = line.match(/^\s*>\s?(.*)$/))) { closeList(); out.push('<blockquote>' + ArtifactMarkdown._inline(m[1]) + '</blockquote>'); }
      else if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) { openList('ul'); out.push('<li>' + ArtifactMarkdown._inline(m[1]) + '</li>'); }
      else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { openList('ol'); out.push('<li>' + ArtifactMarkdown._inline(m[1]) + '</li>'); }
      else if (/^\s*$/.test(line)) { closeList(); out.push(''); }
      else { closeList(); out.push('<p>' + ArtifactMarkdown._inline(line) + '</p>'); }
    }
    closeList();
    return out.join('\n');
  }

  static _inline(text) {
    return text
      .replace(/`([^`]+)`/g, (_, c) => '<code>' + c + '</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  static _restoreBlocks(html, blocks) {
    return html
      .replace(/<p>\s*@@F(\d+)@@\s*<\/p>/g, (_, i) => blocks[+i] || '')
      .replace(/@@F(\d+)@@/g, (_, i) => blocks[+i] || '');
  }
}

module.exports = ArtifactMarkdown;
