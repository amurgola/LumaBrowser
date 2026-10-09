export default class StreamingMarkdown {
  static PARTIAL_FENCE_RE = /\n?[ \t]*`{1,2}$/;

  static close(md) {
    const text = String(md || '');
    const cut = text.lastIndexOf('\n') + 1;
    const last = text.slice(cut);
    if ((text.match(/```/g) || []).length % 2 === 1) {
      if (/^[ \t]*```[\w+-]*$/.test(last)) return StreamingMarkdown.close(text.slice(0, cut));
      const body = text.replace(StreamingMarkdown.PARTIAL_FENCE_RE, '');
      return body + (body.endsWith('\n') ? '```' : '\n```');
    }
    if (/^[ \t]*`{1,2}$/.test(last)) return text.slice(0, cut);
    return text.slice(0, cut) + StreamingMarkdown._closeInline(last);
  }

  static _closeInline(line) {
    const out = line.replace(/\[([^\]\n]*)\]\([^)\s]*$/, '$1');
    if ((out.replace(/```/g, '').match(/`/g) || []).length % 2 === 1) return out.endsWith('`') ? out.slice(0, -1) : out + '`';
    const outsideCode = out.replace(/`[^`]*`/g, '');
    if ((outsideCode.match(/\*\*/g) || []).length % 2 === 0) return out.replace(/(^|\s)\*$/, '$1');
    if (/\*\*\s*$/.test(out)) return out.replace(/\*\*\s*$/, '');
    return out.replace(/\*?\s*$/, '') + '**';
  }
}
