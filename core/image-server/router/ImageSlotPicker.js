class ImageSlotPicker {
  static GENERATE = 'image-generate';

  static EDIT = 'image-edit';

  static explicitRole(slot) {
    if (slot === 'edit') return ImageSlotPicker.EDIT;
    if (slot === 'generate') return ImageSlotPicker.GENERATE;
    return null;
  }

  static remoteRole(slot) {
    return slot === 'edit' ? ImageSlotPicker.EDIT : ImageSlotPicker.GENERATE;
  }

  static requestRole({ explicitRole, model, wantId, defaults }) {
    if (explicitRole) return explicitRole;
    const isEdit = (model && model.kind === 'edit') || wantId === (defaults && defaults.editModelId);
    return isEdit ? ImageSlotPicker.EDIT : ImageSlotPicker.GENERATE;
  }

  static residentSlot(svc, role, wantId) {
    if (role !== ImageSlotPicker.EDIT && role !== ImageSlotPicker.GENERATE) return role;
    const otherRole = role === ImageSlotPicker.EDIT ? ImageSlotPicker.GENERATE : ImageSlotPicker.EDIT;
    const mine = ImageSlotPicker._holds(svc.serverForRole(role), wantId);
    const theirs = ImageSlotPicker._holds(svc.serverForRole(otherRole), wantId);
    return (!mine && theirs) ? otherRole : role;
  }

  static _holds(server, wantId) {
    try {
      const status = server && server.getStatus ? server.getStatus() : null;
      return !!(status && status.plan && status.plan.modelId === wantId
        && (status.state === 'ready' || status.state === 'starting'));
    } catch (_) {
      return false;
    }
  }
}

module.exports = ImageSlotPicker;
