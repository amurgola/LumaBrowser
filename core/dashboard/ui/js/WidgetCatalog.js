export default class WidgetCatalog {
  static KIND_LIVE = 'live';
  static KIND_EXTENSION = 'extension';

  constructor(api) {
    this._api = api;
    this._widgets = new Map();
    this._hidden = new Set();
    this.showHidden = false;
  }

  async refresh() {
    const listing = await this._fetchListing();
    this._widgets.clear();
    for (const w of listing.widgets) {
      this._widgets.set(w.rootId, { kind: WidgetCatalog.KIND_LIVE, title: w.title, conversationId: w.conversationId, latestId: w.id });
    }
    for (const w of listing.extensionWidgets) {
      this._widgets.set(w.rootId, WidgetCatalog._extensionMeta(w));
    }
  }

  get(rootId) {
    return this._widgets.get(rootId);
  }

  isExtension(rootId) {
    const meta = this._widgets.get(rootId);
    return !!meta && meta.kind === WidgetCatalog.KIND_EXTENSION;
  }

  get size() {
    return this._widgets.size;
  }

  visibleEntries() {
    return this._ordered().filter(([rootId]) => !this._hidden.has(rootId));
  }

  hiddenEntries() {
    return this._ordered().filter(([rootId]) => this._hidden.has(rootId));
  }

  async setHidden(rootId, hidden) {
    try { await this._api.widgets.setHidden(rootId, hidden); } catch (_) {}
    if (hidden) this._hidden.add(rootId);
    else this._hidden.delete(rootId);
  }

  _ordered() {
    const all = [...this._widgets];
    return [
      ...all.filter(([, meta]) => meta.kind !== WidgetCatalog.KIND_EXTENSION),
      ...all.filter(([, meta]) => meta.kind === WidgetCatalog.KIND_EXTENSION),
    ];
  }

  async _fetchListing() {
    try {
      const r = await this._api.widgets.listLive();
      if (r && r.success) {
        this._hidden = new Set(Array.isArray(r.hidden) ? r.hidden : []);
        return { widgets: r.widgets || [], extensionWidgets: Array.isArray(r.extensionWidgets) ? r.extensionWidgets : [] };
      }
    } catch (_) {}
    return { widgets: [], extensionWidgets: [] };
  }

  static _extensionMeta(w) {
    return {
      kind: WidgetCatalog.KIND_EXTENSION,
      title: w.title,
      url: w.url,
      extensionId: w.extensionId,
      widgetId: w.widgetId,
      w: w.w,
      h: w.h,
    };
  }
}
