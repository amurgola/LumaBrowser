const InstalledImageModels = require('../service/InstalledImageModels');

class ImageServerConfigs {
  static GENERATE = 'image-generate';
  static EDIT = 'image-edit';
  static VIDEO = 'image-video';

  constructor(imageServerService) {
    this._svc = imageServerService;
  }

  async view() {
    return {
      servers: await this._withLocalModels(this._svc.getServerConfigs()),
      active: {
        generate: this._svc.getActiveServerId(ImageServerConfigs.GENERATE),
        edit: this._svc.getActiveServerId(ImageServerConfigs.EDIT),
        video: this._svc.getActiveServerId(ImageServerConfigs.VIDEO),
      },
    };
  }

  async _withLocalModels(servers) {
    const installed = await this._installedModels();
    return servers.map((server) => {
      if (!server || server.location !== 'local') return server;
      return {
        ...server,
        models: installed.filter((model) => model.kind === server.kind).map((model) => ({ id: model.id, label: model.label })),
        selectedModel: server.selectedModelId || null,
        modelField: InstalledImageModels.DEFAULT_FIELDS[server.kind] || null,
      };
    });
  }

  async _installedModels() {
    if (typeof this._svc.listInstalledModels !== 'function') return [];
    try { return (await this._svc.listInstalledModels()) || []; } catch (_) { return []; }
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
