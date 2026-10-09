import ChatIcons from '../ChatIcons.js';
import ShareLinks from '../common/ShareLinks.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import ArtifactDataStore from '../../artifacts/ArtifactDataStore.js';
import LiveModuleMounter from '../../live/LiveModuleMounter.js';
import LiveModuleSource from '../../live/LiveModuleSource.js';
import LumaBridge from '../../live/LumaBridge.js';

export default class LiveArtifacts {
  constructor(ctx) {
    this._ctx = ctx;
    this._mounts = new Map();
  }

  element(af) {
    const existing = this._mounts.get(af.id);
    if (existing && existing.el) return existing.el;
    const wrap = Dom.el('div', 'cm-live-artifact');
    wrap.appendChild(this._head(af));
    const root = Dom.el('div', 'cm-live-root');
    wrap.appendChild(root);
    this._mounts.set(af.id, { el: wrap });
    requestAnimationFrame(() => this._mount(root, af));
    return wrap;
  }

  dispose() {
    for (const m of this._mounts.values()) {
      if (m && m.store && typeof m.store.dispose === 'function') {
        try { m.store.dispose(); } catch (_) {}
      }
    }
    this._mounts.clear();
  }

  _head(af) {
    const head = Dom.el('div', 'cm-live-head');
    head.innerHTML = '<span class="cm-live-dot"></span>'
      + '<span class="cm-live-title">' + HtmlEscaper.escape(af.title || 'Live module') + '</span>';
    this._ctx.share.refreshStatus();
    const pin = this._pinButton(af);
    if (pin) head.appendChild(pin);
    const share = this._shareButton(af);
    if (share) head.appendChild(share);
    return head;
  }

  _pinButton(af) {
    const api = this._ctx.api;
    const rootId = af.rootId || af.root_id || af.id;
    if (!api || !api.pinToDashboard || !rootId) return null;
    const pin = Dom.el('button', 'cm-live-pin', ChatIcons.grid);
    pin.title = 'Pin to dashboard';
    pin.addEventListener('click', async () => {
      let r = null;
      try { r = await api.pinToDashboard(rootId); } catch (_) {}
      const ok = r && r.success;
      pin.innerHTML = ok ? ChatIcons.check : ChatIcons.x;
      pin.title = ok ? (r.added ? 'Pinned to dashboard' : 'Already on the dashboard') : ((r && r.error) || 'Could not pin');
      setTimeout(() => { pin.innerHTML = ChatIcons.grid; pin.title = 'Pin to dashboard'; }, 1400);
    });
    return pin;
  }

  _shareButton(af) {
    const api = this._ctx.api;
    if (!api || !api.share || !af.id) return null;
    const share = Dom.el('button', 'cm-live-share', ChatIcons.link);
    share.title = 'Copy share link';
    share.addEventListener('click', async () => {
      ShareLinks.flash(share, await this._ctx.share.copyLink('artifact', af.id, af.title));
    });
    return share;
  }

  async _mount(root, af) {
    const js = af.js != null ? String(af.js) : '';
    const store = LiveModuleSource.declaresOwnStore(js) ? null : this._storeFor(af);
    const entry = this._mounts.get(af.id);
    if (entry) entry.store = store;
    const api = this._ctx.api;
    const luma = LumaBridge.create(api && api.liveApi);
    await LiveModuleMounter.mount(root, { html: af.html, js, libs: af.libs, store, luma });
  }

  _storeFor(af) {
    const api = this._ctx.api;
    if (!api || !api.artifactData) return null;
    const rootId = af.rootId || af.root_id || af.id;
    if (!rootId) return null;
    try {
      return ArtifactDataStore.create({ rootId, transport: { kind: 'ipc', api: api.artifactData } });
    } catch (_) {
      return null;
    }
  }
}
