const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const PlacementStore = require('../../shared/runtime/placement/PlacementStore');

class UserGpuPin {
  static isPinnedToGpu(settingsDb, role) {
    try {
      const layout = PlacementStore.load(settingsDb);
      const itemKey = PlacementLayout.SERVER_TO_ITEM[role];
      const resourceId = itemKey ? PlacementLayout.effectiveResourceId(layout, itemKey) : null;
      const resource = resourceId ? PlacementLayout.resourceById(layout, resourceId) : null;
      return !!(resource && resource.kind && resource.kind !== 'ram');
    } catch (_) {
      return false;
    }
  }
}

module.exports = UserGpuPin;
