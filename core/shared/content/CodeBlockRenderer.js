const BlockRenderer = require('./BlockRenderer');

class CodeBlockRenderer extends BlockRenderer {
  static LANGUAGE_PATTERNS = [
    /(?:^|\s)lang(?:uage)?-([\w+#.-]+)/i,
    /(?:^|\s)highlight-(?:source-)?([\w+#.-]+)/i,
    /(?:^|;|\s)brush:\s*([\w+#.-]+)/i,
  ];

  static NOT_A_LANGUAGE = new Set(['none', 'nohighlight', 'plain', 'plaintext', 'text']);

  static MIN_FENCE = 3;

  get elementNames() {
    return ['pre'];
  }

  render(node, writer) {
    const code = CodeBlockRenderer._codeText(node);
    if (!code.trim()) return;
    const fence = CodeBlockRenderer.fenceFor(code, CodeBlockRenderer.MIN_FENCE);
    writer.block(`${fence}${CodeBlockRenderer._language(node)}\n${code}\n${fence}`);
  }

  static fenceFor(code, minimum) {
    const longest = Math.max(0, ...(code.match(/`+/g) || []).map((run) => run.length));
    return '`'.repeat(Math.max(minimum, longest + 1));
  }

  static _codeText(node) {
    return node.plainText().replace(/^\r?\n/, '').replace(/\s+$/, '');
  }

  static _language(pre) {
    const code = pre.find('code');
    for (const node of code ? [pre, code] : [pre]) {
      const found = CodeBlockRenderer._declaredLanguage(node);
      if (found) return found;
    }
    return '';
  }

  static _declaredLanguage(node) {
    const explicit = node.attribute('data-lang') || node.attribute('data-language');
    const className = node.attribute('class') || '';
    const matched = CodeBlockRenderer.LANGUAGE_PATTERNS.map((pattern) => className.match(pattern)).find(Boolean);
    const language = String(explicit || (matched && matched[1]) || '').toLowerCase();
    return CodeBlockRenderer.NOT_A_LANGUAGE.has(language) ? '' : language;
  }
}

module.exports = CodeBlockRenderer;
