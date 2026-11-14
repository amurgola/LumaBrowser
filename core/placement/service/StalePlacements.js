const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const RemoteDeviceRef = require('../../shared/runtime/placement/RemoteDeviceRef');

class StalePlacements {
  static LIVE_STATES = ['ready', 'starting', 'loading'];

  static of(layout, slots = {}) {
    const stale = [];
    for (const item of PlacementLayout.ITEM_KEYS) {
      const entry = StalePlacements._staleEntry(layout, item, slots[item]);
      if (entry) stale.push(entry);
    }
    return stale;
  }

  static _staleEntry(layout, item, slot) {
    if (!slot || !StalePlacements.LIVE_STATES.includes(slot.state)) return null;
    const runningOn = Array.isArray(slot.devices) ? slot.devices : [];
    const resource = PlacementLayout.resourceById(layout, PlacementLayout.effectiveResourceId(layout, item));
    if (!resource || runningOn.length === 0) return null;
    if (resource.kind === 'ram') return { item, runningOn, wants: [], wantsRam: true };
    const wants = (resource.devices || []).filter((device) => !RemoteDeviceRef.isRef(device));
    if (wants.length === 0 || runningOn.every((card) => wants.includes(card))) return null;
    return { item, runningOn, wants, wantsRam: false };
  }
}

module.exports = StalePlacements;
