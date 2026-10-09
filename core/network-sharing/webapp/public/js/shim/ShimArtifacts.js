export default class ShimArtifacts {
  constructor({ api, store, win }) {
    this._api = api;
    this._store = store;
    this._win = win;
  }

  surface() {
    return {
      get: (id) => this.get(id),
      open: (id) => this.open(id),
      delete: (id) => this.delete(id),
    };
  }

  async get(id) {
    const rec = await this._localOrFetched(id);
    if (!rec) return { success: false, error: 'artifact not found' };
    return { success: true, artifact: { id: rec.id, content: rec.content, language: rec.language, title: rec.title, type: rec.type } };
  }

  async open(id) {
    const r = await this.get(id);
    if (r.success) ShimArtifacts._write(this._win.open(), ShimArtifacts.documentFor(r.artifact));
    return { success: true };
  }

  async delete(id) {
    await this._store.artifacts.delete(id);
    return { success: true };
  }

  static documentFor(artifact) {
    if (artifact.type === 'image') {
      return `<img style="max-width:100%" src="data:${artifact.language || 'image/png'};base64,${artifact.content}">`;
    }
    return artifact.content || '';
  }

  async _localOrFetched(id) {
    const rec = await this._store.artifacts.get(id);
    if (rec && rec.content != null) return rec;
    try {
      const full = await this._api.fetchArtifact(id);
      return await this._store.artifacts.put({ id, title: full.title, type: full.type, language: full.mime || full.language, content: full.content });
    } catch (_) {
      return rec;
    }
  }

  static _write(win, html) {
    if (win) win.document.write(html);
  }
}
