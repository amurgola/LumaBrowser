class GlanceOpener {
  static TARGETS = ['hub', 'event', 'thread', 'task'];
  static EVENT_SEARCH_DAYS = 30;

  constructor(deps, glance) {
    this._deps = deps;
    this._glance = glance;
  }

  async open({ target, id } = {}) {
    const kind = String(target || 'hub');
    if (!GlanceOpener.TARGETS.includes(kind)) {
      return { status: 400, body: { success: false, error: `target must be one of ${GlanceOpener.TARGETS.join(', ')}` } };
    }
    if (kind === 'hub') return this._result(kind, null, this._openDashboard());
    const item = await this._find(kind, id == null || id === '' ? null : String(id));
    if (!item && id != null && id !== '') return { status: 404, body: { success: false, error: `No ${kind} with id ${id}`, target: kind } };
    if (item && item.url) return this._result(kind, item, await this._openUrl(item.url), item.url);
    return this._result(kind, item, this._openDashboard());
  }

  _result(target, item, opened, url) {
    if (!opened.success) return { status: 503, body: { success: false, error: opened.error, target } };
    const body = { success: true, target, opened: url ? 'url' : 'dashboard', focused: opened.focused };
    if (item) body.id = item.id;
    if (url) body.url = url;
    return { status: 200, body };
  }

  async _find(kind, id) {
    const hub = this._hub();
    if (!hub) return null;
    if (kind === 'event') {
      if (!id) {
        const summary = await this._glance.get();
        return summary.items.currentEvent || summary.items.nextEvent || null;
      }
      if (typeof hub.listEvents !== 'function') return null;
      const from = new Date(Date.now() - 7 * 86400000).toISOString();
      const to = new Date(Date.now() + GlanceOpener.EVENT_SEARCH_DAYS * 86400000).toISOString();
      const events = (await hub.listEvents({ from, to })) || [];
      return events.find((e) => e && String(e.id) === id) || null;
    }
    if (kind === 'thread') {
      if (!id) {
        const summary = await this._glance.get();
        return summary.items.latestThread || null;
      }
      return typeof hub.getThread === 'function' ? GlanceOpener._unwrap(await hub.getThread(id), 'thread') : null;
    }
    if (!id) {
      const summary = await this._glance.get();
      const due = summary.items.dueTasks;
      return due && due.tasks && due.tasks[0] ? due.tasks[0] : null;
    }
    return typeof hub.getTask === 'function' ? GlanceOpener._unwrap(await hub.getTask(id), 'task') : null;
  }

  static _unwrap(value, key) {
    if (!value || typeof value !== 'object') return null;
    if (value[key] && typeof value[key] === 'object') return value[key];
    return value.id != null ? value : null;
  }

  _openDashboard() {
    const focused = this._focus();
    const dashboard = this._deps.services && this._deps.services.dashboard;
    if (!dashboard || typeof dashboard.ensureTab !== 'function') return { success: false, error: 'The Dashboard is not available.' };
    try {
      const tabId = dashboard.ensureTab({ activate: true });
      return tabId == null ? { success: false, error: 'The Dashboard could not be opened (no browser window).' } : { success: true, focused };
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err) };
    }
  }

  async _openUrl(url) {
    const focused = this._focus();
    const hub = this._hub();
    try {
      if (hub && typeof hub.openUrl === 'function') {
        const r = await hub.openUrl(url);
        return r && r.success === false ? { success: false, error: r.error || 'Could not open the link.' } : { success: true, focused };
      }
      const browser = this._deps.browser;
      if (browser && typeof browser.createTab === 'function') {
        await browser.createTab(String(url), { kind: 'user' });
        return { success: true, focused };
      }
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err) };
    }
    return { success: false, error: 'The browser is not available.' };
  }

  _focus() {
    const w = this._deps.windows;
    try { return !!(w && typeof w.focusMainWindow === 'function' && w.focusMainWindow()); } catch (_) { return false; }
  }

  _hub() {
    let all = null;
    try { all = this._deps.extensions; } catch (_) { all = null; }
    return (all && all['personal-hub']) || null;
  }
}

module.exports = GlanceOpener;
