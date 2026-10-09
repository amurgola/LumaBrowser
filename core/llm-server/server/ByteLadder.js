class ByteLadder {
  static UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  static DEFAULT_ZERO = 'n/a';

  static format(bytes, options) {
    const zero = options && 'zero' in options ? options.zero : ByteLadder.DEFAULT_ZERO;
    const value = Number(bytes);
    if (bytes == null || !Number.isFinite(value) || value <= 0) return zero;
    const { scaled, unit } = ByteLadder._scale(value);
    const decimals = (scaled >= 100 || unit === 0) ? 0 : (scaled >= 10 ? 1 : 2);
    return `${scaled.toFixed(decimals)} ${ByteLadder.UNITS[unit]}`;
  }

  static _scale(value) {
    let scaled = value;
    let unit = 0;
    while (scaled >= 1024 && unit < ByteLadder.UNITS.length - 1) {
      scaled /= 1024;
      unit += 1;
    }
    return { scaled, unit };
  }
}

module.exports = ByteLadder;
