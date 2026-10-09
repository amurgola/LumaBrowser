import HtmlEscaper from '../format/HtmlEscaper.js';
import ReadmeBlocks from './ReadmeBlocks.js';
import ReadmeHtmlTable from './ReadmeHtmlTable.js';
import ReadmeInline from './ReadmeInline.js';
import ReadmeVault from './ReadmeVault.js';

export default class ReadmeRenderer {
  static EMPTY = '<div class="ms-dim">No model card.</div>';

  static render(source) {
    if (!source) return ReadmeRenderer.EMPTY;
    const vault = new ReadmeVault();
    const inline = new ReadmeInline(vault);
    let text = String(source).replace(/\r\n/g, '\n');
    text = ReadmeRenderer._vaultFencedCode(text, vault);
    text = ReadmeRenderer._vaultHtmlTables(text, vault, inline);
    text = ReadmeRenderer._vaultHtmlHeadings(text, vault, inline);
    text = ReadmeRenderer._dropHtmlNoise(text);
    return vault.restore(new ReadmeBlocks(inline).render(text));
  }

  static _vaultFencedCode(text, vault) {
    return text.replace(/```[^\n]*\n([\s\S]*?)```/g, (_m, code) =>
      `\n\n${vault.stash(`<pre class="ms-pre"><code>${HtmlEscaper.escapeKeepingApostrophes(code.replace(/\n$/, ''))}</code></pre>`)}\n\n`);
  }

  static _vaultHtmlTables(text, vault, inline) {
    return text.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_m, body) =>
      `\n\n${vault.stash(ReadmeHtmlTable.render(body, inline))}\n\n`);
  }

  static _vaultHtmlHeadings(text, vault, inline) {
    return text.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level, inner) => {
      const l = Math.min(6, +level);
      return `\n\n${vault.stash(`<h${l} class="ms-h">${inline.render(inner)}</h${l}>`)}\n\n`;
    });
  }

  static _dropHtmlNoise(text) {
    return text
      .replace(/<img\b[^>]*>/gi, '')
      .replace(/<source\b[^>]*\/?>/gi, '')
      .replace(/<\/?(?:picture|figure)\b[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(?:div|span|center|font|small|sub|sup|p|details|summary)\b[^>]*>/gi, '');
  }
}
