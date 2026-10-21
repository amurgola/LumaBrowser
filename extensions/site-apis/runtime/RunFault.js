const Faults = require('../spec/Faults');

class RunFault extends Error {
  constructor(fault) {
    super(fault.message);
    this.name = 'RunFault';
    this.fault = fault;
  }

  static make(code, message, opts = {}) {
    return new RunFault(Faults.make(code, message, opts));
  }

  static step(index, message, detail = null) {
    return RunFault.make(Faults.STEP_FAILED, message, { step: index, detail });
  }

  static faultOf(err, index = null) {
    if (err instanceof RunFault) return err.fault;
    const message = err && err.message ? err.message : String(err);
    return Faults.make(Faults.STEP_FAILED, message, { step: index });
  }
}

module.exports = RunFault;
