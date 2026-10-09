import ChatIcons from '../ChatIcons.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class DocsSourceContext {
  static NAME = 'LumaBrowser documentation';

  static MENTION = 'lumabrowser-documentation';

  static ALIASES = ['lumabrowser-documentation', 'docs', 'documentation', 'lumabrowser'];

  static HINT = 'Let this chat search the app\'s own documentation';

  static SOURCE_ID = 'lumabrowser-documentation';

  constructor(ctx) {
    this._ctx = ctx;
    this._status = null;
  }

  async load() {
    const api = this._ctx.api;
    if (!api || !api.docsSource || typeof api.docsSource.status !== 'function') return;
    try {
      const r = await api.docsSource.status();
      this._status = r && r.success !== false && r.available ? r : null;
    } catch (_) {
      this._status = null;
    }
  }

  available() {
    return !!this._status;
  }

  status() {
    return this._status;
  }

  static matches(query) {
    const q = String(query || '').toLowerCase();
    return !q || DocsSourceContext.ALIASES.some((a) => a.startsWith(q));
  }

  on() {
    return this._ctx.state.docsSource === true;
  }

  set(on) {
    const { state } = this._ctx;
    const next = !!on && this.available();
    if (state.docsSource === next) return;
    state.docsSource = next;
    this._ctx.attachments.render();
    this._persist();
  }

  enable() {
    this.set(true);
    this._ctx.composer.focus();
  }

  disable() {
    this.set(false);
  }

  async restore(conversationId) {
    const { state, api } = this._ctx;
    state.docsSource = false;
    if (!conversationId || !this.available() || !api.conv || !api.conv.meta) return;
    try {
      const r = await api.conv.meta.get(conversationId);
      const sources = r && r.success && r.meta && r.meta.data && Array.isArray(r.meta.data.docsSources) ? r.meta.data.docsSources : [];
      state.docsSource = sources.includes(DocsSourceContext.SOURCE_ID);
    } catch (_) {
      state.docsSource = false;
    }
  }

  async _persist() {
    const { state, api } = this._ctx;
    const id = state.activeId;
    if (!id || !api.conv || !api.conv.meta) return;
    try {
      const r = await api.conv.meta.get(id);
      const data = (r && r.success && r.meta && r.meta.data) || {};
      const docsSources = state.docsSource ? [DocsSourceContext.SOURCE_ID] : [];
      await api.conv.meta.set(id, { data: { ...data, docsSources } });
    } catch (_) {}
  }

  pillHtml() {
    const esc = HtmlEscaper.escape;
    const s = this._status || {};
    const title = s.documents ? `${DocsSourceContext.NAME}: ${s.documents} pages this chat can search` : DocsSourceContext.NAME;
    return '<span class="cm-att docs" title="' + esc(title) + '">'
      + '<span class="cm-att-ic">' + DocsSourceContext.iconHtml() + '</span>'
      + '<span class="cm-att-name">' + esc(DocsSourceContext.NAME) + '</span>'
      + '<button class="cm-att-x" data-docs-off type="button" title="Stop using the documentation in this chat">×</button>'
      + '</span>';
  }

  static iconHtml() {
    return ChatIcons.book;
  }
}
