import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class LiteMarkdown {
  static FENCE = /```(\w*)\n?([\s\S]*?)```/g;

  static render(text) {
    if (!text) return '';
    const parts = String(text).split(LiteMarkdown.FENCE);
    let html = '';
    for (let i = 0; i < parts.length; i += 3) {
      html += LiteMarkdown._inline(parts[i]);
      if (i + 2 < parts.length) html += `<pre><code>${HtmlEscaper.escape(parts[i + 2])}</code></pre>`;
    }
    return html;
  }

  static _inline(text) {
    return HtmlEscaper.escape(text)
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
}
