class ImageSlotLauncher {
  static START_FAILED = 'Failed to start the image server.';

  constructor({ imageServerService }) {
    this._svc = imageServerService;
  }

  async ensureReady({ wantId, slotRole, send }) {
    const server = this._svc.serverForRole(slotRole);
    const status = server.getStatus();
    const state = { server, status, cold: false, needSwitch: ImageSlotLauncher._needsSwitch(status, wantId) };
    await this._joinStartInProgress(state, send);
    const startError = await this._relaunchIfNeeded(state, wantId, slotRole, send);
    if (startError) return { error: startError, cold: true };
    if (state.status.state !== 'ready' || !state.status.port) {
      return { error: `Image server is ${state.status.state}, not ready.`, cold: state.cold };
    }
    return state;
  }

  async _joinStartInProgress(state, send) {
    if (state.status.state !== 'starting' || state.needSwitch) return;
    send('status', { phase: 'starting-server' });
    const settled = await state.server.waitUntilSettled();
    state.status = state.server.getStatus();
    if (settled !== 'ready' && state.status.state !== 'ready') state.cold = true;
  }

  async _relaunchIfNeeded(state, wantId, slotRole, send) {
    if (state.status.state === 'ready' && !state.needSwitch) return null;
    state.cold = true;
    send('status', { phase: state.needSwitch ? 'switching-model' : 'starting-server' });
    await this._stopIfRunning(state);
    const result = await this._svc.startServerResolved(wantId, { role: slotRole });
    if (!result || !result.success) return (result && result.error) || ImageSlotLauncher.START_FAILED;
    state.status = state.server.getStatus();
    return null;
  }

  async _stopIfRunning(state) {
    if (state.status.state !== 'ready' && state.status.state !== 'starting') return;
    try { await state.server.stop(); } catch (_) {}
  }

  static _needsSwitch(status, wantId) {
    const running = status.plan && status.plan.modelId;
    return !!(running && running !== wantId);
  }
}

module.exports = ImageSlotLauncher;
