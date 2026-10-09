class UnpackGlob {
  static build(patterns) {
    if (!Array.isArray(patterns) || patterns.length === 0) return null;
    const expanded = patterns.flatMap((p) => UnpackGlob._expand(p));
    return expanded.length === 1 ? expanded[0] : `{${expanded.join(',')}}`;
  }

  static _expand(pattern) {
    const anchored = pattern.startsWith('**/') ? pattern : `**/${pattern}`;
    if (!pattern.toLowerCase().endsWith('.js')) return [anchored];
    return [anchored, `${anchored.slice(0, -3)}.jsc`];
  }
}

module.exports = UnpackGlob;
