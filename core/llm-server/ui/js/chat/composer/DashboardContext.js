import ChatIcons from '../ChatIcons.js';

export default class DashboardContext {
  static NAME = 'Dashboard';

  static HINT = 'What your Dashboard widgets show right now';

  static MENTION = 'dashboard';

  constructor(ctx) {
    this._ctx = ctx;
  }

  available() {
    const pc = this._ctx.api && this._ctx.api.pageContext;
    return !!(pc && typeof pc.readDashboard === 'function');
  }

  static matches(query) {
    return !query || DashboardContext.MENTION.startsWith(String(query).toLowerCase());
  }

  async attach() {
    if (!this.available()) return;
    const { state } = this._ctx;
    let r;
    try { r = await this._ctx.api.pageContext.readDashboard(); } catch (e) { r = { success: false, error: (e && e.message) || 'read failed' }; }
    state.attachments = state.attachments.filter((f) => !f.dashboard);
    const staged = (r && r.success !== false && typeof r.text === 'string')
      ? DashboardContext.attachment(r)
      : { kind: 'text', name: DashboardContext.NAME, error: (r && r.error) || 'The Dashboard could not be read.', dashboard: { widgets: [] } };
    this._ctx.attachments.add([staged]);
    this._ctx.composer.focus();
  }

  static attachment(r) {
    const widgets = Array.isArray(r.widgets) ? r.widgets : [];
    const body = String(r.text).replace(/^```/gm, ' ```')
      + (r.truncated ? '\n\n[The Dashboard had more; only the beginning is included.]' : '');
    return {
      kind: 'text',
      name: DashboardContext.NAME,
      size: r.chars || body.length,
      text: body,
      language: 'markdown',
      truncated: !!r.truncated,
      source: widgets.length + (widgets.length === 1 ? ' widget' : ' widgets'),
      dashboard: { widgets: widgets.map((w) => ({ rootId: w.rootId, title: w.title })), at: r.at || null },
    };
  }

  static iconHtml() {
    return ChatIcons.grid;
  }
}
