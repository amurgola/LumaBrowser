class VramBand {
  static BANDS = Object.freeze(['normal', 'low', 'critical']);

  static of(freeBytes, reserveBytes) {
    if (!Number.isFinite(freeBytes) || !(reserveBytes > 0)) return 'normal';
    if (freeBytes < reserveBytes / 2) return 'critical';
    if (freeBytes < reserveBytes) return 'low';
    return 'normal';
  }
}

module.exports = VramBand;
