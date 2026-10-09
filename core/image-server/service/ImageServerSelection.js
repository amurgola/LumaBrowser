const ImageSlotRoles = require('./ImageSlotRoles');

class ImageServerSelection {
  static LOCAL_GENERATE_ID = 'local:generate';
  static LOCAL_EDIT_ID = 'local:edit';

  static ACTIVE_KEYS = {
    [ImageSlotRoles.GENERATE]: 'core.imageServer.activeGenerateServerId',
    [ImageSlotRoles.EDIT]: 'core.imageServer.activeEditServerId',
  };

  static LOCAL = {
    [ImageSlotRoles.GENERATE]: { id: ImageServerSelection.LOCAL_GENERATE_ID, name: 'Local · Image Generation', kind: 'generate', field: 'modelId' },
    [ImageSlotRoles.EDIT]: { id: ImageServerSelection.LOCAL_EDIT_ID, name: 'Local · Image Editor', kind: 'edit', field: 'editModelId' },
  };

  constructor({ settingsDb, remoteServers, getDefaults, resolveDisplayName }) {
    this._db = settingsDb;
    this._remote = remoteServers;
    this._getDefaults = getDefaults;
    this._resolveDisplayName = resolveDisplayName;
  }

  localEntry(role) {
    const local = ImageServerSelection.LOCAL[ImageSlotRoles.pickerRole(role)];
    const modelId = this._getDefaults()[local.field] || null;
    return {
      id: local.id, name: local.name, location: 'local',
      kind: local.kind, selectedModelId: modelId,
      selectedModelLabel: modelId ? this._resolveDisplayName(modelId) : null,
      available: !!modelId, managedByCore: true,
    };
  }

  list() {
    return [this.localEntry(ImageSlotRoles.GENERATE), this.localEntry(ImageSlotRoles.EDIT), ...this._remote.list()];
  }

  getActiveId(role) {
    const picker = ImageSlotRoles.pickerRole(role);
    const fallback = ImageServerSelection.LOCAL[picker].id;
    return this._db.get(ImageServerSelection.ACTIVE_KEYS[picker], fallback) || fallback;
  }

  setActiveId(role, id) {
    const picker = ImageSlotRoles.pickerRole(role);
    this._db.set(ImageServerSelection.ACTIVE_KEYS[picker], id || ImageServerSelection.LOCAL[picker].id);
    return this.getActiveId(picker);
  }

  getActive(role) {
    const wantId = this.getActiveId(role);
    if (wantId === ImageServerSelection.LOCAL_GENERATE_ID) return this.localEntry(ImageSlotRoles.GENERATE);
    if (wantId === ImageServerSelection.LOCAL_EDIT_ID) return this.localEntry(ImageSlotRoles.EDIT);
    return this._remote.list().find((s) => s.id === wantId) || this.localEntry(role);
  }

  isReady(role, localEnabled) {
    const active = this.getActive(ImageSlotRoles.pickerRole(role));
    if (!active) return false;
    if (active.location === 'remote') return true;
    return !!localEnabled && !!active.selectedModelId;
  }

  removeRemote(id) {
    const kept = this._remote.remove(id);
    for (const role of [ImageSlotRoles.GENERATE, ImageSlotRoles.EDIT]) {
      if (this.getActiveId(role) === id) this.setActiveId(role, null);
    }
    return kept;
  }

  removeForPeer(peerId) {
    if (!peerId) return;
    for (const id of this._remote.idsForPeer(peerId)) this.removeRemote(id);
  }
}

module.exports = ImageServerSelection;
