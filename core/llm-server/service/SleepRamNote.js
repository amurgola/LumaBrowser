const os = require('os');
const RamPinFitGate = require('../../shared/runtime/rampin/RamPinFitGate');

class SleepRamNote {
  static KIND = 'sleep';
  static INFO = 'info';
  static WARN = 'warn';

  constructor({ getStatus, freemem = () => os.freemem(), totalmem = () => os.totalmem() }) {
    this._getStatus = getStatus;
    this._freemem = freemem;
    this._totalmem = totalmem;
  }

  noteFor(buildRow) {
    const freeBytes = Number(this._freemem()) || 0;
    const heldBytes = this._heldBytes(buildRow);
    if (heldBytes == null) {
      return { text: `How much RAM a sleep holds is shown once the model has loaded. ${SleepRamNote._gib(freeBytes)} of RAM is free now.`, tone: SleepRamNote.INFO };
    }
    const fit = RamPinFitGate.evaluate({ freeBytes, totalRamBytes: Number(this._totalmem()) || 0, pinBytes: heldBytes });
    const held = `A sleep would hold about ${SleepRamNote._gib(heldBytes)} of RAM`;
    if (fit.ok) return { text: `${held}; ${SleepRamNote._gib(freeBytes)} is free now.`, tone: SleepRamNote.INFO };
    return {
      text: `${held}, but only ${SleepRamNote._gib(freeBytes)} is free now and the system keeps ${SleepRamNote._gib(fit.reserveBytes)} for itself. Free some RAM first or leave this off.`,
      tone: SleepRamNote.WARN,
    };
  }

  _heldBytes(buildRow) {
    let status = null;
    try { status = this._getStatus(); } catch (_) { status = null; }
    const plan = status && status.plan;
    if (!plan || !buildRow || plan.runtimeId !== buildRow.id) return null;
    const bytes = Number(plan.modelEstimatedBytes);
    return Number.isFinite(bytes) && bytes > 0 ? bytes : null;
  }

  static _gib(bytes) {
    return `${(bytes / RamPinFitGate.GIB).toFixed(1)} GiB`;
  }
}

module.exports = SleepRamNote;
