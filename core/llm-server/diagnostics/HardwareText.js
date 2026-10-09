class HardwareText {
  static PLACEHOLDER = /^(unknown|not specified|none|to be filled)/i;

  static clean(value) {
    if (value == null) return null;
    const text = String(value).trim();
    if (!text || HardwareText.PLACEHOLDER.test(text)) return null;
    return text;
  }

  static numberOrNull(value) {
    if (value == null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
}

module.exports = HardwareText;
