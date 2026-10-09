import HtmlEscaper from '../format/HtmlEscaper.js';

export default class CodeHighlighter {
  static RULES = [
    [/(^|[^\\])(\/\/[^\n]*|#[^\n]*)/g, 'com'],
    [/\/\*[\s\S]*?\*\//g, 'com'],
    [/(["'`])(?:\\.|(?!\1).)*\1/g, 'str'],
    [/\b\d[\d_.eExXa-fA-F]*\b/g, 'num'],
    [/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|import|from|export|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|def|elif|lambda|None|True|False|nil|null|undefined|true|false|public|private|protected|static|void|int|float|string|bool|struct|interface|type|enum|package|func|defer|select|chan|map|fn|pub|mut|match|impl|trait|where|self)\b/g, 'kw'],
    [/\b([A-Za-z_]\w*)(?=\s*\()/g, 'fn'],
  ];

  static highlight(code) {
    const src = HtmlEscaper.escapeKeepingApostrophes(code);
    let out = '';
    let i = 0;
    while (i < src.length) {
      const token = CodeHighlighter._tokenAt(src, i);
      if (token) {
        out += token.lead + '<span class="cm-tk-' + token.cls + '">' + token.text + '</span>';
        i += token.lead.length + token.text.length;
      } else {
        out += src[i];
        i++;
      }
    }
    return out;
  }

  static _tokenAt(src, i) {
    for (const [re, cls] of CodeHighlighter.RULES) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (m && m.index === i) return CodeHighlighter._token(m, cls);
    }
    return null;
  }

  static _token(m, cls) {
    if (cls === 'com' && m[1] !== undefined && m[2] !== undefined) return { lead: m[1], text: m[2], cls };
    if (cls === 'fn' && m[1] !== undefined) return { lead: '', text: m[1], cls };
    return { lead: '', text: m[0], cls };
  }
}
