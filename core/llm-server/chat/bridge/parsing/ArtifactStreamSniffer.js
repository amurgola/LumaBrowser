class ArtifactStreamSniffer {
  static ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '"': '"', '\\': '\\', '/': '/' };

  static field(buf, name) {
    const m = buf.match(new RegExp('"' + name + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
    return m ? ArtifactStreamSniffer.unescape(m[1]) : null;
  }

  static stringValue(buf, name) {
    const m = buf.match(new RegExp('"' + name + '"\\s*:\\s*"'));
    if (!m) return null;
    let out = '';
    let escaped = false;
    for (let i = m.index + m[0].length; i < buf.length; i++) {
      const c = buf[i];
      if (escaped) { out += '\\' + c; escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (c === '"') return ArtifactStreamSniffer.unescape(out);
      out += c;
    }
    return ArtifactStreamSniffer.unescape(out + (escaped ? '\\' : ''));
  }

  static unescape(s) {
    const text = s.endsWith('\\') ? s.slice(0, -1) : s;
    return text.replace(/\\(u[0-9a-fA-F]{4}|["\\/bfnrt])/g, (m, g) => {
      if (g[0] === 'u') return String.fromCharCode(parseInt(g.slice(1), 16));
      return ArtifactStreamSniffer.ESCAPES[g] || m;
    });
  }
}

module.exports = ArtifactStreamSniffer;
