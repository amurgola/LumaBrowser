const GgufFileName = require('./GgufFileName');

class GgufCompanionPicker {
  static PROJECTOR_RANK = { F16: 0, FP16: 0, BF16: 1, F32: 2, FP32: 2 };

  static OTHER_PROJECTOR_RANK = 5;

  static bestMmproj(list) {
    const candidates = GgufCompanionPicker._present(list);
    if (!candidates.length) return null;
    return candidates.sort((a, b) =>
      GgufCompanionPicker._projectorRank(a.precision) - GgufCompanionPicker._projectorRank(b.precision)
      || GgufCompanionPicker._bytes(b) - GgufCompanionPicker._bytes(a))[0];
  }

  static bestMtp(list, { quant } = {}) {
    const candidates = GgufCompanionPicker._present(list);
    if (!candidates.length) return null;
    const want = quant ? String(quant).toUpperCase() : null;
    const matches = (head) => (want && head.quant === want ? 1 : 0);
    return candidates.sort((a, b) =>
      matches(b) - matches(a)
      || GgufCompanionPicker._bits(b.quant) - GgufCompanionPicker._bits(a.quant)
      || GgufCompanionPicker._bytes(b) - GgufCompanionPicker._bytes(a))[0];
  }

  static _present(list) {
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }

  static _projectorRank(precision) {
    const rank = GgufCompanionPicker.PROJECTOR_RANK[precision];
    return rank === undefined ? GgufCompanionPicker.OTHER_PROJECTOR_RANK : rank;
  }

  static _bits(quant) {
    return GgufFileName.bitWidth(quant) || 0;
  }

  static _bytes(file) {
    return file.approxBytes || 0;
  }
}

module.exports = GgufCompanionPicker;
