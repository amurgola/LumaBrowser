class RoleplayIpcHandlers {
  constructor(ipc, debug, labFlag) {
    this._ipc = ipc;
    this._debug = debug;
    this._labFlag = labFlag;
  }

  register() {
    if (!this._ipc || typeof this._ipc.handle !== 'function') return;
    this._ipc.handle('debugReaction', (_e, payload) => this._debug.reaction(payload));
    this._ipc.handle('debugOutfit', (_e, payload) => this._debug.outfit(payload));
    this._ipc.handle('debugStaging', (_e, payload) => this._debug.staging(payload));
    this._ipc.handle('debugAudit', (_e, payload) => this._debug.audit(payload));
    this._ipc.handle('getLabFlag', () => ({ enabled: this._labFlag.enabled() }));
    this._ipc.handle('setLabFlag', (_e, on) => this._labFlag.set(on));
  }
}

module.exports = RoleplayIpcHandlers;
