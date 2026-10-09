class ImageServerConfigs {
  static GENERATE = 'image-generate';
  static EDIT = 'image-edit';

  constructor(imageServerService) {
    this._svc = imageServerService;
  }

  view() {
    return {
      servers: this._svc.getServerConfigs(),
      active: {
        generate: this._svc.getActiveServerId(ImageServerConfigs.GENERATE),
        edit: this._svc.getActiveServerId(ImageServerConfigs.EDIT),
      },
    };
  }

  setActive(role, id) {
    return { activeId: this._svc.setActiveServerId(ImageServerConfigs.roleOf(role), id) };
  }

  static roleOf(role) {
    return role === ImageServerConfigs.EDIT || role === 'edit' ? ImageServerConfigs.EDIT : ImageServerConfigs.GENERATE;
  }
}

module.exports = ImageServerConfigs;
