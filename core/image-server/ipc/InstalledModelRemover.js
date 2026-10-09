const fs = require('fs');
const ImageModelManifest = require('./ImageModelManifest');

class InstalledModelRemover {
  constructor(imageServerService) {
    this._svc = imageServerService;
  }

  async remove(id) {
    if (!id || typeof id !== 'string') throw new Error('id required');
    const dir = ImageModelManifest.modelDir(this._svc.getModelsDirConfig().effectivePath, id);
    if (!dir) throw new Error('invalid model id');
    if (!fs.existsSync(dir)) throw new Error('not installed');
    await this._releaseSlots(id);
    fs.rmSync(dir, { recursive: true, force: true });
  }

  async _releaseSlots(id) {
    const defaults = this._svc.getDefaults();
    for (const slot of this._svc.slots()) {
      const wasPinned = defaults[slot.defaultKey] === id;
      if (wasPinned) this._unpin(slot.defaultKey);
      await InstalledModelRemover._stopIfHosting(slot.server, id, wasPinned);
    }
  }

  _unpin(defaultKey) {
    try { this._svc.setDefaults({ [defaultKey]: null }); } catch (_) {}
  }

  static async _stopIfHosting(server, id, wasPinned) {
    try {
      const status = server.getStatus() || {};
      const hosting = status.plan ? status.plan.modelId === id : wasPinned;
      if (status.state !== 'idle' && hosting) await server.stop();
    } catch (_) {}
  }
}

module.exports = InstalledModelRemover;
