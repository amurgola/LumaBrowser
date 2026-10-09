export default class ByteFormatter {
  static UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  static DEFAULT_ZERO = 'n/a';

  static GIB = 1024 * 1024 * 1024;

  static bytes(value, options) {
    const zero = options && 'zero' in options ? options.zero : ByteFormatter.DEFAULT_ZERO;
    const number = Number(value);
    if (value == null || !Number.isFinite(number) || number <= 0) return zero;
    const { scaled, unit } = ByteFormatter._scale(number);
    const decimals = (scaled >= 100 || unit === 0) ? 0 : (scaled >= 10 ? 1 : 2);
    return `${scaled.toFixed(decimals)} ${ByteFormatter.UNITS[unit]}`;
  }

  static gb(value) {
    const gigabytes = (Number(value) || 0) / ByteFormatter.GIB;
    return (gigabytes >= 10 ? gigabytes.toFixed(0) : gigabytes.toFixed(1)) + ' GB';
  }

  static _scale(number) {
    let scaled = number;
    let unit = 0;
    while (scaled >= 1024 && unit < ByteFormatter.UNITS.length - 1) {
      scaled /= 1024;
      unit += 1;
    }
    return { scaled, unit };
  }
}
