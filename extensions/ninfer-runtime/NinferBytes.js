const NinferCatalog = require('./NinferCatalog');

class NinferBytes {
  static MiB = 1024 * 1024;

  static format(n) {
    const v = Number(n) || 0;
    if (v >= NinferCatalog.GiB) return `${(v / NinferCatalog.GiB).toFixed(1)} GiB`;
    if (v >= NinferBytes.MiB) return `${Math.round(v / NinferBytes.MiB)} MiB`;
    return `${v} B`;
  }
}

module.exports = NinferBytes;
