class VersionCompare {
  static compare(a, b) {
    const left = VersionCompare._parts(a);
    const right = VersionCompare._parts(b);
    for (let i = 0; i < Math.max(left.length, right.length); i++) {
      const diff = (left[i] || 0) - (right[i] || 0);
      if (diff) return diff;
    }
    return 0;
  }

  static _parts(version) {
    return String(version || '').split('.').map((n) => parseInt(n, 10) || 0);
  }
}

module.exports = VersionCompare;
