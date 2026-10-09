const CudaPin = require('../../../shared/runtime/CudaPin');

class PeerGpuBorrow {
  constructor({ rpcPeers, log }) {
    this._rpcPeers = rpcPeers;
    this._log = log;
  }

  async borrow(ctx) {
    if (!PeerGpuBorrow._wanted(ctx)) return;
    if (this._fitsLocally(ctx)) {
      ctx.overrides.rpcSkippedFitsLocal = true;
      this._log.log('[llm-server] peer GPUs not borrowed: model fully fits local VRAM.');
      return;
    }
    await this._acquire(ctx);
  }

  async release(ctx) {
    if (!ctx.rpcAcquired) return;
    try { await this._rpcPeers.releaseAll(); } catch (_) {}
  }

  static _wanted(ctx) {
    return PeerGpuBorrow._layoutRemoteWanted(ctx) || !!(ctx.defaults.usePeerGpus && !ctx.layout.placed);
  }

  static _layoutRemoteWanted(ctx) {
    return ctx.layout.remote.length > 0;
  }

  _fitsLocally(ctx) {
    try {
      const probe = ctx.plan({
        diagnostics: PeerGpuBorrow._probeDiagnostics(ctx),
        overrides: { ...ctx.overrides, noAutoCpuMoe: true },
      });
      return !!(probe.plan && probe.plan.fullOffload);
    } catch (_) {
      return false;
    }
  }

  static _probeDiagnostics(ctx) {
    const local = ctx.layout.localDevices;
    if (PeerGpuBorrow._layoutRemoteWanted(ctx) && local.length) {
      return CudaPin.filterDiagnosticsToDevices(ctx.diag, local.join(','));
    }
    return ctx.diag;
  }

  async _acquire(ctx) {
    try {
      const want = PeerGpuBorrow._layoutRemoteWanted(ctx) ? PeerGpuBorrow.wantList(ctx.layout.remote) : null;
      const acquired = await this._rpcPeers.acquireForLaunch(want ? { want } : undefined);
      if (acquired.servers.length) {
        ctx.overrides.rpcServers = acquired.servers;
        ctx.rpcAcquired = true;
      }
      for (const skip of (acquired.skipped || [])) {
        this._log.warn(`[llm-server] peer GPUs skipped for this start: ${skip.name}: ${skip.reason}`);
      }
    } catch (err) {
      this._log.warn('[llm-server] peer GPU acquire failed:', err && err.message);
    }
  }

  static wantList(remoteRefs) {
    const want = [];
    for (const ref of remoteRefs) {
      let entry = want.find((w) => w.peerId === ref.peerId);
      if (!entry) { entry = { peerId: ref.peerId, devices: [] }; want.push(entry); }
      if (!entry.devices.includes(ref.index)) entry.devices.push(ref.index);
    }
    return want;
  }
}

module.exports = PeerGpuBorrow;
