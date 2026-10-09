import Clipboard from '../../dom/Clipboard.js';
import ChatIcons from '../ChatIcons.js';

export default class ShareLinks {
  static CACHE_MS = 4000;

  constructor(ctx) {
    this._ctx = ctx;
    this._checkedAt = 0;
  }

  refreshStatus(force) {
    const { api, state } = this._ctx;
    if (!api || !api.share) { state.shareAvail = false; return Promise.resolve(false); }
    const now = Date.now();
    if (!force && now - this._checkedAt < ShareLinks.CACHE_MS) return Promise.resolve(state.shareAvail);
    this._checkedAt = now;
    return api.share.status().then((r) => {
      state.shareAvail = !!(r && r.available);
      if (this._ctx.root) this._ctx.root.classList.toggle('cm-share-on', state.shareAvail);
      return state.shareAvail;
    }).catch(() => { state.shareAvail = false; return false; });
  }

  async copyLink(kind, targetId, title) {
    const api = this._ctx.api;
    if (!api || !api.share) return null;
    try {
      const r = await api.share.create(kind, targetId, title);
      if (r && r.success && r.url) return (await Clipboard.copyText(r.url)) ? r.url : null;
    } catch (_) {}
    return null;
  }

  static flash(btn, url) {
    btn.innerHTML = url ? ChatIcons.check : ChatIcons.x;
    btn.title = url ? 'Link copied' : 'Share failed: is the web backend running?';
    setTimeout(() => { btn.innerHTML = ChatIcons.link; btn.title = 'Copy share link'; }, 1400);
  }
}
