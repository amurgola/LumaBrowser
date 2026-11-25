class DeviceDisplay {
  static SIZE_STEP = 8;
  static SMALLEST_SIDE = 320;
  static LARGEST_SIDE = 4096;
  static DENSITY = { low: 120, high: 640 };

  constructor(shell) {
    this._shell = shell;
    this.current = null;
    this._pending = Promise.resolve();
  }

  fit(frame) {
    const target = DeviceDisplay.normalise(frame);
    if (!target || DeviceDisplay.same(target, this.current)) return this._pending;
    this.current = target;
    this._pending = this._pending
      .then(() => this._shell(`wm size ${target.width}x${target.height}; wm density ${target.density}`))
      .catch(() => {});
    return this._pending;
  }

  static normalise(frame) {
    const { width, height, density } = frame || {};
    if (![width, height, density].every((value) => Number.isFinite(value) && value > 0)) return null;
    const side = (value) => Math.max(DeviceDisplay.SMALLEST_SIDE, Math.min(DeviceDisplay.LARGEST_SIDE, Math.floor(value / DeviceDisplay.SIZE_STEP) * DeviceDisplay.SIZE_STEP));
    return {
      width: side(width),
      height: side(height),
      density: Math.max(DeviceDisplay.DENSITY.low, Math.min(DeviceDisplay.DENSITY.high, Math.round(density))),
    };
  }

  static same(first, second) {
    return !!first && !!second && first.width === second.width && first.height === second.height && first.density === second.density;
  }
}

module.exports = DeviceDisplay;
