export default class MediaArtifactCache {
  constructor(ctx) {
    this._ctx = ctx;
    this._entries = new Map();
    this._pending = new Map();
  }

  peek(id) {
    return this._entries.get(id);
  }

  load(id) {
    if (!id) return Promise.resolve(null);
    if (this._entries.has(id)) return Promise.resolve(this._entries.get(id));
    if (this._pending.has(id)) return this._pending.get(id);
    const p = this._fetch(id);
    this._pending.set(id, p);
    p.finally(() => this._pending.delete(id));
    return p;
  }

  async _fetch(id) {
    let r;
    try { r = await this._ctx.api.artifact.get(id); } catch (_) { r = null; }
    if (!r || !r.success || !r.artifact) return null;
    const mime = r.artifact.language || 'image/png';
    const b64 = r.artifact.content || '';
    if (!b64) return null;
    const entry = { b64, mime, dataUrl: 'data:' + mime + ';base64,' + b64 };
    this._entries.set(id, entry);
    return entry;
  }
}
