import ByteFormatter from '../../format/ByteFormatter.js';

export default class DiagnosticsText {
  static MIB = 1024 * 1024;

  static mb(n) {
    if (n == null || !Number.isFinite(Number(n))) return 'n/a';
    return ByteFormatter.bytes(Number(n) * DiagnosticsText.MIB);
  }

  static pct(used, total) {
    if (!total) return '0%';
    return `${Math.round((used / total) * 100)}%`;
  }

  static usageBadgeClass(ratio) {
    if (ratio < 0.7) return 'luma-badge ok';
    if (ratio < 0.9) return 'luma-badge warn';
    return 'luma-badge bad';
  }
}
