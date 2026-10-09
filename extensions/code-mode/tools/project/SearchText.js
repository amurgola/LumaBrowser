class SearchText {
  static skippedNote(res) {
    const dirs = res && Array.isArray(res.skippedDirs) ? res.skippedDirs : [];
    if (!dirs.length) return '';
    return ` (Search never descends into ${dirs.join(', ')}; to look inside one,`
      + ' name it in the glob, e.g. "build/**".)';
  }

  static boundedBody(truncator, lines, limitReached, limitNote) {
    const bounded = truncator.truncate(lines.join('\n'), { strategy: 'head' });
    const capped = limitReached ? `\n[${limitNote}]` : '';
    return `${bounded.text}${bounded.notice ? `\n${bounded.notice}` : ''}${capped}`;
  }

  static plural(n, one, many) {
    return n === 1 ? one : many;
  }
}

module.exports = SearchText;
