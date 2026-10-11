class UnpackGlob {
  static build(patterns) {
    if (!Array.isArray(patterns) || patterns.length === 0) return null;
    const anchored = patterns.map((p) => (p.startsWith('**/') ? p : `**/${p}`));
    return anchored.length === 1 ? anchored[0] : `{${anchored.join(',')}}`;
  }
}

module.exports = UnpackGlob;
