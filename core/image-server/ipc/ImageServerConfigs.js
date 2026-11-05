class ImageServerConfigs {
  static GENERATE = 'image-generate';
  static EDIT = 'image-edit';
  static VIDEO = 'image-video';

  constructor(imageServerService) {
    this._svc = imageServerService;
  }

  view() {
    return {
      servers: this._svc.getServerConfigs(),
      active: {
        generate: this._svc.getActiveServerId(ImageServerConfigs.GENERATE),
        edit: this._svc.getActiveServerId(ImageServerConfigs.EDIT),
        video: this._svc.getActiveServerId(ImageServerConfigs.VIDEO),
      },
    };
  }

  setActive(role, id) {
    return { activeId: this._svc.setActiveServerId(ImageServerConfigs.roleOf(role), id) };
  }

  static roleOf(role) {
    if (role === ImageServerConfigs.EDIT || role === 'edit') return ImageServerConfigs.EDIT;
    if (role === ImageServerConfigs.VIDEO || role === 'video') return ImageServerConfigs.VIDEO;
    return ImageServerConfigs.GENERATE;
  }
}

module.exports = ImageServerConfigs;
