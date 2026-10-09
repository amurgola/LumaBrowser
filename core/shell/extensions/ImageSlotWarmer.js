const ExtensionGlobals = require('./ExtensionGlobals');

class ImageSlotWarmer {
  static ROLES = { edit: 'image-edit', generate: 'image-generate' };
  static LIVE_STATES = ['ready', 'starting'];

  constructor({ gpuCount, sharePool, imageService } = {}) {
    this._gpuCount = gpuCount || ImageSlotWarmer._liveGpuCount;
    this._sharePool = sharePool || ImageSlotWarmer._liveSharePool;
    this._imageService = imageService || ExtensionGlobals.imageServerService;
  }

  static warmAction(status, wantId) {
    const state = status && status.state;
    if (!ImageSlotWarmer.LIVE_STATES.includes(state)) return 'start';
    const runningModelId = status && status.plan && status.plan.modelId;
    return runningModelId === wantId ? 'coalesce' : 'switch';
  }

  async warm(slot, modelRef = null) {
    if (!this._slotsOnSeparateCards()) return;
    try {
      await this._warmSlot(slot, modelRef);
    } catch (_) {
    }
  }

  _slotsOnSeparateCards() {
    try {
      if (this._gpuCount() < 2) return false;
      return !this._sharePool(ImageSlotWarmer.ROLES.generate, ImageSlotWarmer.ROLES.edit);
    } catch (_) {
      return false;
    }
  }

  async _warmSlot(slot, modelRef) {
    const service = this._imageService();
    if (!service || typeof service.serverForRole !== 'function' || typeof service.startServerResolved !== 'function') return;
    const role = slot === 'edit' ? ImageSlotWarmer.ROLES.edit : ImageSlotWarmer.ROLES.generate;
    const wantId = ImageSlotWarmer._wantedModelId(service, slot, modelRef);
    if (!wantId) return;
    const server = service.serverForRole(role);
    const action = ImageSlotWarmer.warmAction(server && server.getStatus && server.getStatus(), wantId);
    if (action === 'coalesce') return;
    if (action === 'switch' && server && typeof server.stop === 'function') {
      try { await server.stop(); } catch (_) {}
    }
    await service.startServerResolved(wantId, { role });
  }

  static _wantedModelId(service, slot, modelRef) {
    const explicitId = typeof modelRef === 'string' ? modelRef.replace(/^local::/, '') : null;
    if (explicitId) return explicitId;
    const defaults = typeof service.getDefaults === 'function' ? service.getDefaults() : null;
    if (!defaults) return null;
    return slot === 'edit' ? (defaults.editModelId || defaults.modelId) : defaults.modelId;
  }

  static _liveGpuCount() {
    return require('../../shared/runtime/CudaDeviceProbe').gpuCount();
  }

  static _liveSharePool(a, b) {
    return require('../../shared/runtime/HotswapCoordinator').shared.sharePool(a, b);
  }
}

module.exports = ImageSlotWarmer;
