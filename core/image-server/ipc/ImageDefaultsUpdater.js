const ImageSlots = require('./ImageSlots');

class ImageDefaultsUpdater {
  static PINNED_MODEL_KEYS = ['modelId', 'editModelId'];

  constructor(imageServerService) {
    this._svc = imageServerService;
  }

  async update(payload) {
    const patch = payload || {};
    const before = this._svc.getDefaults();
    const defaults = this._svc.setDefaults(patch);
    const changed = (key) => patch[key] !== undefined && before[key] !== defaults[key];
    const serverStopped = await this._stopChangedSlots(changed);
    this._reconcileRamPin(changed, defaults);
    return { defaults, serverStopped };
  }

  async _stopChangedSlots(changed) {
    const runtimeChanged = changed('runtimeId');
    let stopped = false;
    for (const slot of this._svc.slots()) {
      if (!changed(slot.defaultKey) && !runtimeChanged) continue;
      if (await ImageSlots.stopIfRunning(slot.server)) stopped = true;
    }
    return stopped;
  }

  _reconcileRamPin(changed, defaults) {
    const pinnedModelMoved = ImageDefaultsUpdater.PINNED_MODEL_KEYS.some(changed) && defaults.pinModelRam;
    if (changed('pinModelRam') || pinnedModelMoved) this._svc.ramPin.apply();
  }
}

module.exports = ImageDefaultsUpdater;
