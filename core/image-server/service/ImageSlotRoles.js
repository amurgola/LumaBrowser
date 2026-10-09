class ImageSlotRoles {
  static GENERATE = 'image-generate';
  static EDIT = 'image-edit';
  static VIDEO = 'image-video';
  static ALL = [ImageSlotRoles.GENERATE, ImageSlotRoles.EDIT, ImageSlotRoles.VIDEO];

  static DEFAULT_KEYS = {
    [ImageSlotRoles.GENERATE]: 'modelId',
    [ImageSlotRoles.EDIT]: 'editModelId',
    [ImageSlotRoles.VIDEO]: 'videoModelId',
  };

  static normalize(role) {
    return ImageSlotRoles.ALL.includes(role) ? role : ImageSlotRoles.GENERATE;
  }

  static pickerRole(role) {
    return role === ImageSlotRoles.EDIT ? ImageSlotRoles.EDIT : ImageSlotRoles.GENERATE;
  }

  static defaultKey(role) {
    return ImageSlotRoles.DEFAULT_KEYS[ImageSlotRoles.normalize(role)];
  }

  static profile(role, model = {}) {
    const isEdit = role === ImageSlotRoles.EDIT || model.kind === 'edit';
    const isVideo = role === ImageSlotRoles.VIDEO || model.kind === 'video';
    return { isEdit, isVideo, isWanVideo: isVideo && model.family === 'wan-video' };
  }
}

module.exports = ImageSlotRoles;
