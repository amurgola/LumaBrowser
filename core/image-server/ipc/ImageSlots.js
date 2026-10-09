class ImageSlots {
  constructor(imageServerService) {
    this._svc = imageServerService;
  }

  async stopHosting(modelId) {
    try {
      for (const { server } of this._svc.slots()) {
        if (server && ImageSlots.isHosting(server.getStatus(), modelId)) await server.stop();
      }
    } catch (_) {}
  }

  async stopAll() {
    const primary = this._svc.runtimeServer;
    const status = await primary.stop();
    for (const slot of this._svc.slots()) {
      if (slot.server === primary) continue;
      try { await slot.server.stop(); } catch (_) {}
    }
    return status;
  }

  status() {
    const status = this._svc.runtimeServer.getStatus();
    try { status.editServer = this._svc.editRuntimeServer.getStatus(); } catch (_) {}
    return status;
  }

  static async stopIfRunning(server) {
    try {
      if (server.getStatus().state === 'idle') return false;
      await server.stop();
      return true;
    } catch (err) {
      console.warn('[image-server] stop-on-defaults failed:', err && err.message);
      return false;
    }
  }

  static isHosting(status, modelId) {
    return !!(status && status.plan && status.plan.modelId === modelId && status.state !== 'idle');
  }
}

module.exports = ImageSlots;
