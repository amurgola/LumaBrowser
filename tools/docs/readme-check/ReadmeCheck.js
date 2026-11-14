const path = require('path');

class ReadmeCheck {
  static DEFAULT_MAX_WORDS = 1500;
  static DASHES = /[–—]/;

  static run(text, { maxWords = ReadmeCheck.DEFAULT_MAX_WORDS, baseDir, exists, readText = null }) {
    const problems = [];
    const words = ReadmeCheck.countWords(text);
    if (words > maxWords) problems.push(`${words} words is over the budget of ${maxWords}; move detail into Documentation/features`);
    const anchors = ReadmeCheck.anchors(text);
    for (const link of ReadmeCheck.links(text)) {
      if (/^(https?:|mailto:)/i.test(link.target)) continue;
      const [file, hash] = link.target.split('#');
      if (!file) {
        if (hash && !anchors.has(hash.toLowerCase())) problems.push(`line ${link.line}: no heading for #${hash}`);
        continue;
      }
      const abs = path.resolve(baseDir, decodeURIComponent(file));
      if (!exists(abs)) { problems.push(`line ${link.line}: ${file} does not exist`); continue; }
      if (hash && readText && /\.md$/i.test(file)) {
        const other = readText(abs);
        if (other != null && !ReadmeCheck.anchors(other).has(hash.toLowerCase())) problems.push(`line ${link.line}: ${file} has no heading for #${hash}`);
      }
    }
    for (const img of ReadmeCheck.images(text)) {
      if (img.alt === null) problems.push(`line ${img.line}: image ${img.src} has no alt attribute (use alt="" when it is decoration)`);
    }
    text.split('\n').forEach((line, i) => {
      if (ReadmeCheck.DASHES.test(line)) problems.push(`line ${i + 1}: em or en dash`);
    });
    return { words, problems };
  }

  static countWords(text) {
    const prose = ReadmeCheck._withoutCode(text)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\]\([^)]*\)/g, '] ')
      .replace(/[|#*_>`\-\[\]]/g, ' ');
    return prose.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  }

  static links(text) {
    const out = [];
    ReadmeCheck._lines(text).forEach(({ line, n }) => {
      for (const m of line.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) out.push({ target: m[1], line: n });
      for (const m of line.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) out.push({ target: m[1], line: n });
    });
    return out;
  }

  static images(text) {
    const out = [];
    ReadmeCheck._lines(text).forEach(({ line, n }) => {
      for (const m of line.matchAll(/<img\b[^>]*>/gi)) {
        const src = /\bsrc=["']([^"']+)["']/i.exec(m[0]);
        const alt = /\balt=["']([^"']*)["']/i.exec(m[0]);
        out.push({ src: src ? src[1] : '', alt: alt ? alt[1] : null, line: n });
      }
      for (const m of line.matchAll(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)/g)) out.push({ src: m[2], alt: m[1], line: n });
    });
    return out;
  }

  static anchors(text) {
    const set = new Set();
    ReadmeCheck._lines(text).forEach(({ line }) => {
      const m = /^#{1,6}\s+(.*)$/.exec(line);
      if (!m) return;
      const title = m[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '').trim().toLowerCase();
      set.add(title.replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-'));
    });
    return set;
  }

  static _withoutCode(text) {
    return text.replace(/\r\n/g, '\n').replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ');
  }

  static _lines(text) {
    const out = [];
    let fenced = false;
    text.replace(/\r\n/g, '\n').split('\n').forEach((line, i) => {
      if (/^\s*```/.test(line)) { fenced = !fenced; return; }
      if (!fenced) out.push({ line, n: i + 1 });
    });
    return out;
  }
}

module.exports = ReadmeCheck;
