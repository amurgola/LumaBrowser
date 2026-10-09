import ArtifactDataStore from '../../../llm-server/ui/js/artifacts/ArtifactDataStore.js';
import LiveModuleMounter from '../../../llm-server/ui/js/live/LiveModuleMounter.js';
import LiveModuleSource from '../../../llm-server/ui/js/live/LiveModuleSource.js';
import LumaBridge from '../../../llm-server/ui/js/live/LumaBridge.js';
import ExtensionWidgetMount from './ExtensionWidgetMount.js';
import WidgetCards from './WidgetCards.js';

export default class WidgetMounts {
  static LIVE_ROOT_HTML = '<div class="cm-live-root"></div>';

  constructor({ api, doc, catalog, cards, refreshDock }) {
    this._api = api;
    this._doc = doc;
    this._catalog = catalog;
    this._cards = cards;
    this._refreshDock = refreshDock;
    this._mounted = new Map();
  }

  async mount(rootId, card) {
    const root = card.querySelector('.cm-live-root');
    if (!root) return;
    if (this._catalog.isExtension(rootId)) {
      await this._mountExtension(rootId, root);
      return;
    }
    const meta = await this._fetchArtifact(rootId);
    if (!meta || meta.type !== 'live') {
      card.replaceWith(this._cards.tombstone());
      return;
    }
    this._applyTitle(card, meta.title);
    await this._mountSpec(rootId, root, meta);
  }

  dispose(rootId) {
    const m = this._mounted.get(rootId);
    if (m && m.store && typeof m.store.dispose === 'function') {
      try { m.store.dispose(); } catch (_) {}
    }
    if (m && typeof m.dispose === 'function') {
      try { m.dispose(); } catch (_) {}
    }
    this._mounted.delete(rootId);
  }

  isMounted(rootId) {
    return this._mounted.has(rootId);
  }

  async remount(rootId, card) {
    const body = card.querySelector('.db-card-body');
    if (!body) return;
    this.dispose(rootId);
    await this._refreshDock();
    body.innerHTML = WidgetMounts.LIVE_ROOT_HTML;
    await this.mount(rootId, card);
  }

  async remountStale() {
    await this._refreshDock();
    for (const [rootId, m] of [...this._mounted]) {
      if (m.kind === 'extension') continue;
      const meta = this._catalog.get(rootId);
      if (!meta || !meta.latestId || !m.latestId || meta.latestId === m.latestId) continue;
      const card = WidgetCards.find(this._doc, rootId);
      const body = card && card.querySelector('.db-card-body');
      if (!body) continue;
      this.dispose(rootId);
      body.innerHTML = WidgetMounts.LIVE_ROOT_HTML;
      await this.mount(rootId, card);
    }
  }

  async _mountExtension(rootId, root) {
    const meta = this._catalog.get(rootId);
    this.dispose(rootId);
    const handle = await ExtensionWidgetMount.mount(root, meta, this._api);
    this._mounted.set(rootId, { kind: 'extension', dispose: handle.dispose });
  }

  async _fetchArtifact(rootId) {
    const dockMeta = this._catalog.get(rootId);
    const fetchId = (dockMeta && dockMeta.latestId) || rootId;
    const meta = await this._getArtifact(fetchId);
    if (meta || fetchId === rootId) return meta;
    return this._getArtifact(rootId);
  }

  async _getArtifact(id) {
    try {
      const r = await this._api.artifact.get(id);
      if (r && r.success) return r.artifact;
    } catch (_) {}
    return null;
  }

  _applyTitle(card, title) {
    const titleEl = card.querySelector('.db-card-title');
    if (titleEl && title) titleEl.textContent = title;
  }

  async _mountSpec(rootId, root, meta) {
    const spec = WidgetMounts._parseSpec(meta.content);
    const js = spec.js != null ? String(spec.js) : '';
    const store = this._createStore(rootId, js);
    this.dispose(rootId);
    this._mounted.set(rootId, { kind: 'live', store, latestId: meta.id });
    const luma = LumaBridge.create(this._api.liveApi);
    await LiveModuleMounter.mount(root, { html: spec.html, js, libs: spec.libs, store, luma });
  }

  _createStore(rootId, js) {
    if (LiveModuleSource.declaresOwnStore(js)) return null;
    try {
      return ArtifactDataStore.create({ rootId, transport: { kind: 'ipc', api: this._api.artifactData } });
    } catch (_) {
      return null;
    }
  }

  static _parseSpec(content) {
    try {
      const spec = JSON.parse(content || '{}');
      return spec && typeof spec === 'object' ? spec : {};
    } catch (_) {
      return {};
    }
  }
}
