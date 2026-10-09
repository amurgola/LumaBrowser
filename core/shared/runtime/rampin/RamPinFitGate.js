const HotswapRamGate = require('../HotswapRamGate');

class RamPinFitGate {
  static GIB = 1024 * 1024 * 1024;

  static evaluate({ freeBytes, totalRamBytes, pinBytes, modelName }) {
    const reserveBytes = HotswapRamGate.ramReserveBytes(totalRamBytes);
    const ok = (freeBytes || 0) - (pinBytes || 0) >= reserveBytes;
    const message = ok ? null : RamPinFitGate._refusal({ freeBytes, pinBytes, modelName, reserveBytes });
    return { ok, reserveBytes, message };
  }

  static _refusal({ freeBytes, pinBytes, modelName, reserveBytes }) {
    const gib = (bytes, digits) => (bytes / RamPinFitGate.GIB).toFixed(digits);
    return `Not enough free RAM to pin ${modelName || 'the model'}: it needs ${gib(pinBytes, 1)} GiB `
      + `with ${gib(freeBytes, 1)} GiB free, keeping ${gib(reserveBytes, 0)} GiB headroom for the system.`;
  }
}

module.exports = RamPinFitGate;
