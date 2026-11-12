class DocGlob {
  static problem(pattern) {
    if (typeof pattern !== 'string' || !pattern.trim()) return 'empty pattern';
    return DocGlob._wholePatternProblem(pattern) || DocGlob._segmentProblem(pattern);
  }

  static compile(pattern) {
    const problem = DocGlob.problem(pattern);
    if (problem) throw new Error(`invalid glob "${pattern}": ${problem}`);
    const segments = pattern.split('/').map((s) => (s === '**' ? '**' : DocGlob._segmentRegex(s)));
    return (p) => DocGlob._matchSegments(segments, 0, DocGlob.normalizePath(p).split('/'), 0);
  }

  static normalizePath(p) {
    return String(p || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
  }

  static _wholePatternProblem(p) {
    if (p.includes('\\')) return 'use forward slashes';
    if (p.startsWith('/')) return 'patterns are relative to the project root; drop the leading slash';
    if (p.includes('//')) return 'empty path segment';
    if (p.endsWith('/')) return 'trailing slash; use dir/** for a directory';
    if (/\*{3,}/.test(p)) return 'three or more stars in a row';
    if (p.includes('{') || p.includes('}')) return 'brace expansion is not supported';
    return null;
  }

  static _segmentProblem(p) {
    for (const seg of p.split('/')) {
      if (seg.includes('**') && seg !== '**') return '** must be a whole path segment';
      if (seg === '.' || seg === '..') return 'relative segments are not allowed';
    }
    return null;
  }

  static _segmentRegex(seg) {
    let re = '';
    for (const ch of seg) {
      if (ch === '*') re += '[^/]*';
      else if (ch === '?') re += '[^/]';
      else re += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
    return new RegExp(`^${re}$`);
  }

  static _matchSegments(segs, si, parts, pi) {
    if (si === segs.length) return pi === parts.length;
    const seg = segs[si];
    if (seg === '**') return DocGlob._matchAnyDepth(segs, si, parts, pi);
    if (pi >= parts.length || !seg.test(parts[pi])) return false;
    return DocGlob._matchSegments(segs, si + 1, parts, pi + 1);
  }

  static _matchAnyDepth(segs, si, parts, pi) {
    for (let k = pi; k <= parts.length; k++) {
      if (DocGlob._matchSegments(segs, si + 1, parts, k)) return true;
    }
    return false;
  }
}

module.exports = DocGlob;
