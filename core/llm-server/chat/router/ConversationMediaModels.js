const ImageModelPicks = require('../../../image-server/router/ImageModelPicks');

class ConversationMediaModels {
  static META_KEY = 'mediaModels';

  constructor(store, conversationId) {
    this._store = store;
    this._id = conversationId;
  }

  read() {
    try {
      const meta = this._store.getMeta(this._id);
      return ImageModelPicks.normalize(meta && meta.data && meta.data[ConversationMediaModels.META_KEY]);
    } catch (_) {
      return {};
    }
  }

  save(picks) {
    const next = ImageModelPicks.normalize(picks);
    const meta = this._store.getMeta(this._id);
    const data = (meta && meta.data) || {};
    const current = ImageModelPicks.normalize(data[ConversationMediaModels.META_KEY]);
    if (JSON.stringify(current) === JSON.stringify(next)) return;
    this._store.setMeta(this._id, { data: { ...data, [ConversationMediaModels.META_KEY]: next } });
  }

  async usable(imageServerService) {
    const picks = this.read();
    if (!Object.keys(picks).length) return picks;
    try {
      return ImageModelPicks.installedOnly(picks, await imageServerService.listInstalledModels());
    } catch (_) {
      return {};
    }
  }
}

module.exports = ConversationMediaModels;
