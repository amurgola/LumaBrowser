class MarkdownInline {
  static render(text, t) {
    const codes = [];
    let s = MarkdownInline._stashCodeSpans(text, codes);
    s = s.replace(/\\([\\`*_{}[\]()#+\-.!~])/g, (_, c) => `\x01${c.charCodeAt(0)}\x01`);
    s = MarkdownInline._links(s, t);
    s = MarkdownInline._emphasis(s, t);
    s = s.replace(/\x01(\d+)\x01/g, (_, c) => String.fromCharCode(Number(c)));
    return s.replace(/\x00(\d+)\x00/g, (_, i) => t.fg('warn', codes[Number(i)]));
  }

  static _stashCodeSpans(text, codes) {
    return text.replace(/`([^`\n]+)`/g, (_, c) => { codes.push(c); return `\x00${codes.length - 1}\x00`; });
  }

  static _links(s, t) {
    const linked = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, url) => t.link(url, t.underline(t.fg('accent', label))));
    return linked.replace(/(^|[\s(])((?:https?|file):\/\/[^\s<>)]+)/g, (_, pre, url) => `${pre}${t.link(url, t.underline(t.fg('accent', url)))}`);
  }

  static _emphasis(s, t) {
    let out = s.replace(/\*\*([^*\n]+?)\*\*/g, (_, b) => t.bold(b));
    out = out.replace(/__([^_\n]+?)__/g, (_, b) => t.bold(b));
    out = out.replace(/(^|[^\w*])\*([^*\n]+?)\*(?!\w)/g, (_, pre, i) => `${pre}${t.italic(i)}`);
    out = out.replace(/(^|[^\w_])_([^_\n]+?)_(?!\w)/g, (_, pre, i) => `${pre}${t.italic(i)}`);
    return out.replace(/~~([^~\n]+?)~~/g, (_, x) => t.strike(x));
  }
}

module.exports = MarkdownInline;
