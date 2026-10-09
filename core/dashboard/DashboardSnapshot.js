const ExtensionApiCall = require('../shell/extensions/ExtensionApiCall');
const DashboardContribution = require('../shell/extensions/DashboardContribution');
const ExtensionWidgetCatalog = require('./ExtensionWidgetCatalog');

class DashboardSnapshot {
  static TITLE = 'Dashboard';

  static MAX_CHARS = 60000;

  static MAX_WIDGET_CHARS = 24000;

  static UNAVAILABLE = 'The Dashboard is not available.';

  static EMPTY = 'The Dashboard has no widgets yet. Open it and place a widget first.';

  static NO_CONTEXT = '(This widget does not share its data with the chat.)';

  static NO_DATA = '(No saved data.)';

  constructor({ dashboardService = null, getAgentDeps = null, getExtensionManager = null, now = () => new Date() } = {}) {
    this._dashboard = dashboardService;
    this._agentDeps = typeof getAgentDeps === 'function' ? getAgentDeps : () => null;
    this._extensions = typeof getExtensionManager === 'function' ? getExtensionManager : () => null;
    this._catalog = new ExtensionWidgetCatalog(this._extensions);
    this._now = now;
  }

  async read() {
    if (!this._dashboard || typeof this._dashboard.getLayout !== 'function') return { success: false, error: DashboardSnapshot.UNAVAILABLE };
    const placed = this._activeWidgets();
    if (!placed.length) return { success: false, error: DashboardSnapshot.EMPTY };
    const at = this._now();
    const sections = [];
    for (const widget of placed) sections.push(await this._section(widget));
    const header = `# ${DashboardSnapshot.TITLE}\n\nCaptured ${DashboardSnapshot._stamp(at)}. ${sections.length} widget${sections.length === 1 ? '' : 's'}: ${sections.map((s) => s.title).join(', ')}.`;
    const full = [header, ...sections.map((s) => `## ${s.title}\n\n${s.text}`)].join('\n\n');
    const truncated = full.length > DashboardSnapshot.MAX_CHARS;
    return {
      title: DashboardSnapshot.TITLE,
      text: truncated ? full.slice(0, DashboardSnapshot.MAX_CHARS) : full,
      chars: full.length,
      truncated,
      at: at.toISOString(),
      widgets: sections.map((s) => ({ rootId: s.rootId, title: s.title, kind: s.kind, chars: s.text.length, ...(s.error ? { error: s.error } : {}) })),
    };
  }

  _activeWidgets() {
    const layout = this._dashboard.getLayout().slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const extensions = new Map(this._catalog.list().map((w) => [w.rootId, w]));
    const live = new Map(this._liveRoots().map((r) => [r.rootId, r]));
    const out = [];
    for (const item of layout) {
      const ext = extensions.get(item.rootId);
      if (ext) { out.push({ rootId: item.rootId, kind: 'extension', title: ext.title, extension: ext }); continue; }
      const root = live.get(item.rootId);
      if (root) out.push({ rootId: item.rootId, kind: 'live', title: root.title || 'Untitled widget' });
    }
    return out;
  }

  _liveRoots() {
    const deps = this._agentDeps();
    const store = deps && deps.artifactStore;
    if (!store || typeof store.listLiveRoots !== 'function') return [];
    try { return store.listLiveRoots() || []; } catch (_) { return []; }
  }

  async _section(widget) {
    const body = widget.kind === 'extension' ? await this._extensionText(widget) : this._liveText(widget);
    const text = DashboardSnapshot._capWidget(body.text);
    return { rootId: widget.rootId, kind: widget.kind, title: body.title || widget.title, text, ...(body.error ? { error: body.error } : {}) };
  }

  async _extensionText({ rootId, title, extension }) {
    if (!extension.context) return { text: DashboardSnapshot.NO_CONTEXT };
    const parsed = DashboardContribution.parseRootId(rootId);
    const r = await ExtensionApiCall.invokeWidgetContext(this._extensions(), parsed.extensionId, parsed.widgetId, [{ widgetId: parsed.widgetId, rootId, title }]);
    if (!r.success) return { text: `(This widget could not be read: ${r.error})`, error: r.error };
    const result = r.result;
    if (typeof result === 'string') return { text: result.trim() || DashboardSnapshot.NO_DATA };
    if (result && typeof result === 'object' && typeof result.text === 'string') {
      return { text: result.text.trim() || DashboardSnapshot.NO_DATA, title: typeof result.title === 'string' && result.title.trim() ? result.title.trim() : null };
    }
    return { text: DashboardSnapshot.NO_DATA };
  }

  _liveText({ rootId }) {
    const deps = this._agentDeps();
    const store = deps && deps.artifactDataStore;
    if (!store || typeof store.all !== 'function') return { text: DashboardSnapshot.NO_DATA };
    let snapshot;
    try { snapshot = store.all(rootId); } catch (err) { return { text: `(This widget could not be read: ${err.message})`, error: err.message }; }
    const data = snapshot && snapshot.success !== false ? snapshot.data : null;
    if (!data || typeof data !== 'object' || !Object.keys(data).length) return { text: DashboardSnapshot.NO_DATA };
    return { text: 'Saved state (JSON):\n\n' + JSON.stringify(data, null, 2) };
  }

  static _capWidget(text) {
    const s = String(text || '');
    if (s.length <= DashboardSnapshot.MAX_WIDGET_CHARS) return s;
    return s.slice(0, DashboardSnapshot.MAX_WIDGET_CHARS) + '\n\n[This widget had more; only the beginning is included.]';
  }

  static _stamp(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())} (UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)})`;
  }
}

module.exports = DashboardSnapshot;
