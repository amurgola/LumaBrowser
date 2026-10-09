const CudaPin = require('../../../shared/runtime/CudaPin');
const CudaDeviceProbe = require('../../../shared/runtime/CudaDeviceProbe');
const CudaDevicePicker = require('../../../shared/runtime/CudaDevicePicker');

class LlmPlacement {
  constructor({ vram }) {
    this._vram = vram;
  }

  place(ctx) {
    try {
      const probe = ctx.plan();
      const need = probe.plan && probe.plan.modelEstimatedBytes;
      const placement = this._reserve(ctx, LlmPlacement.requestedBytes(ctx, need));
      ctx.cudaDevice = placement.cudaDevice;
      ctx.tensorSplit = placement.split || null;
    } catch (_) {}
    ctx.planDiag = ctx.cudaDevice ? CudaPin.filterDiagnosticsToDevices(ctx.diag, ctx.cudaDevice) : ctx.diag;
    LlmPlacement._yieldSplitToUser(ctx);
  }

  placeForRescue(ctx, headerEstimatedBytes) {
    let cudaDevice = null;
    try {
      const need = Number(headerEstimatedBytes) > 0 ? Number(headerEstimatedBytes) : undefined;
      cudaDevice = this._reserve(ctx, need).cudaDevice;
    } catch (_) {}
    const diagnostics = cudaDevice ? CudaPin.filterDiagnosticsToDevices(ctx.diag, cudaDevice) : ctx.diag;
    return { cudaDevice, diagnostics };
  }

  _reserve(ctx, requiredBytes) {
    return this._vram.reserve({
      serverId: 'llm', role: 'llm', allowSplit: true,
      requiredBytes,
      settingsDb: ctx.settingsDb, diagnostics: ctx.diag,
    });
  }

  static requestedBytes(ctx, need) {
    if (!(Number(need) > 0)) return undefined;
    const rpcInPlay = Array.isArray(ctx.overrides.rpcServers) && ctx.overrides.rpcServers.length > 0;
    if (!rpcInPlay) return Number(need);
    const localRoom = LlmPlacement._localRoomBytes(ctx.diag);
    return localRoom > 0 ? Math.max(1, Math.min(Number(need), localRoom)) : undefined;
  }

  static _localRoomBytes(diag) {
    let room = 0;
    try {
      for (const d of CudaDeviceProbe.readDevices(diag)) {
        const free = d.freeBytes != null ? Number(d.freeBytes) : (Number(d.totalBytes) || 0);
        room += Math.max(0, free - CudaDevicePicker.PER_CARD_RESERVE_BYTES);
      }
    } catch (_) {}
    return room;
  }

  static _yieldSplitToUser(ctx) {
    const split = ctx.tensorSplit;
    if (Array.isArray(split) && split.length > 1 && ctx.layout.splitUserDrawn) {
      ctx.overrides.manualTensorSplitActive = true;
    }
  }
}

module.exports = LlmPlacement;
