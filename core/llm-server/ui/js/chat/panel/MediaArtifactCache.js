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
    const entry = MediaArtifactCache.entry(b64, mime);
    this._entries.set(id, entry);
    return entry;
  }

  static entry(b64, mime) {
    let dataUrl = null;
    const inline = () => { if (dataUrl === null) dataUrl = 'data:' + mime + ';base64,' + b64; return dataUrl; };
    const entry = { b64, mime, url: null };
    Object.defineProperty(entry, 'dataUrl', { get: inline, enumerable: true });
    entry.url = MediaArtifactCache._blobUrl(b64, mime) || inline();
    return entry;
  }

  static _blobUrl(b64, mime) {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function' || typeof Blob === 'undefined') return null;
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    } catch (_) {
      return null;
    }
  }
}
