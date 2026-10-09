class SliderValue {
  static MAX_DECIMALS = 10;

  static snap(value, { min = 0, max = 100, step = 1 } = {}) {
    const clamped = SliderValue._clamp(Number(value), min, max);
    if (!step || step <= 0) return clamped;
    const snapped = SliderValue._clamp(min + Math.round((clamped - min) / step) * step, min, max);
    return SliderValue._roundToStepPrecision(snapped, step);
  }

  static _roundToStepPrecision(value, step) {
    const decimals = (String(step).split('.')[1] || '').length;
    return Number(value.toFixed(Math.min(SliderValue.MAX_DECIMALS, decimals)));
  }

  static _clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
}

module.exports = SliderValue;
