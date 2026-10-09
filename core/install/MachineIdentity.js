class MachineIdentity {
  static ENV_OVERRIDE = 'LUMA_MACHINE_ID';

  constructor({ env = process.env, readMachineId = MachineIdentity._readMachineId } = {}) {
    this._env = env;
    this._readMachineId = readMachineId;
    this._machineId = null;
  }

  get machineId() {
    return this._machineId;
  }

  async resolve() {
    if (!this._machineId) this._machineId = this._overrideId() || await this._readMachineId();
    return this._machineId;
  }

  _overrideId() {
    const id = this._env[MachineIdentity.ENV_OVERRIDE];
    return id ? String(id).trim() || null : null;
  }

  static _readMachineId() {
    return require('node-machine-id').machineId({ original: true });
  }
}

module.exports = MachineIdentity;
