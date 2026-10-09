import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class TabContext {
  static SUGGEST_MS = 30 * 60 * 1000;

  constructor(ctx) {
    this._ctx = ctx;
    this._onDocClick = (e) => this._docClick(e);
    this._listening = false;
  }

  available() {
    const pc = this._ctx.api && this._ctx.api.pageContext;
    return !!(pc && typeof pc.listTabs === 'function' && typeof pc.readTab === 'function');
  }

  wireButton(btn) {
    if (!btn) return;
    if (!this.available()) { btn.hidden = true; return; }
    btn.hidden = false;
    btn.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(btn); });
    this._listen();
    this.refreshSuggestion();
  }

  async list() {
    if (!this.available()) return [];
    try {
      const r = await this._ctx.api.pageContext.listTabs();
      return (r && Array.isArray(r.tabs)) ? r.tabs : [];
    } catch (_) {
      return [];
    }
  }

  toggle(btn) {
    const existing = this._ctx.root.querySelector('.cm-tabs-pop');
    this.close();
    if (!existing) this.open(btn);
  }

  close() {
    if (this._ctx.root) this._ctx.root.querySelectorAll('.cm-tabs-pop').forEach((e) => e.remove());
    document.removeEventListener('click', this._onDocClick);
  }

  async open(btn) {
    const composer = btn.closest('.cm-composer');
    if (!composer) return;
    this._ctx.popovers.closeAll();
    this._ctx.gear.close();
    const pop = Dom.el('div', 'cm-tabs-pop', '<div class="cm-gear-sec">Ask about an open tab</div>'
      + '<div class="cm-tabs-list"><div class="cm-tabs-empty">Loading tabs…</div></div>');
    composer.appendChild(pop);
    setTimeout(() => document.addEventListener('click', this._onDocClick), 0);
    const tabs = await this.list();
    const list = pop.querySelector('.cm-tabs-list');
    if (!list) return;
    if (!tabs.length) { list.innerHTML = '<div class="cm-tabs-empty">No web pages are open.</div>'; return; }
    list.innerHTML = tabs.map((t, i) => TabContext._rowHtml(t, i === 0 && !!t.lastActivatedAt)).join('');
    list.querySelectorAll('[data-tab-id]').forEach((row) => row.addEventListener('click', () => {
      const tab = tabs.find((t) => String(t.id) === row.dataset.tabId);
      if (tab) this.attach(tab, row);
    }));
  }

  async attach(tab, row) {
    const { state } = this._ctx;
    if (state.attachments.some((f) => f.page && f.page.tabId === tab.id && f.page.url === tab.url)) { this._finish(); return; }
    if (row) { row.disabled = true; row.querySelector('.cm-tabs-host').textContent = 'Reading…'; }
    let r;
    try { r = await this._ctx.api.pageContext.readTab(tab.id); } catch (e) { r = { success: false, error: (e && e.message) || 'read failed' }; }
    state.tabSuggestSkip.add(TabContext._key(tab));
    if (state.tabSuggestion && TabContext._key(state.tabSuggestion) === TabContext._key(tab)) state.tabSuggestion = null;
    const staged = (r && r.success !== false && typeof r.text === 'string')
      ? TabContext.pageAttachment(r, tab)
      : { kind: 'text', name: TabContext._cleanName(tab.title, tab.url), error: (r && r.error) || 'The page could not be read.' };
    this._ctx.attachments.add([staged]);
    this._finish();
  }

  async refreshSuggestion() {
    const { state } = this._ctx;
    const tabs = await this.list();
    const t = tabs[0];
    const fresh = t && t.lastActivatedAt && (Date.now() - t.lastActivatedAt) < TabContext.SUGGEST_MS;
    const next = fresh && !state.tabSuggestSkip.has(TabContext._key(t)) ? t : null;
    const prev = state.tabSuggestion;
    if ((prev && prev.id) === (next && next.id) && (prev && prev.url) === (next && next.url)) return;
    state.tabSuggestion = next;
    this._ctx.attachments.render();
  }

  acceptSuggestion() {
    const t = this._ctx.state.tabSuggestion;
    if (!t) return;
    const name = this._ctx.root.querySelector('[data-tab-suggest] .cm-att-name');
    if (name) name.textContent = 'Reading…';
    this.attach(t, null);
  }

  dismissSuggestion() {
    const { state } = this._ctx;
    if (!state.tabSuggestion) return;
    state.tabSuggestSkip.add(TabContext._key(state.tabSuggestion));
    state.tabSuggestion = null;
    this._ctx.attachments.render();
  }

  static suggestionHtml(t) {
    const esc = HtmlEscaper.escape;
    return '<span class="cm-att cm-att-suggest" title="' + esc(t.url) + '">'
      + '<button type="button" class="cm-att-suggest-go" data-tab-suggest>'
      + '<span class="cm-att-ic">' + TabContext.iconHtml(t.favicon) + '</span>'
      + '<span class="cm-att-name">Ask about ' + esc(TabContext._cleanName(t.title, t.url)) + '</span></button>'
      + '<button class="cm-att-x" data-tab-suggest-x type="button" title="Not this page">×</button>'
      + '</span>';
  }

  static iconHtml(favicon) {
    if (typeof favicon === 'string' && /^data:image\//.test(favicon)) {
      return '<img class="cm-tab-fav" alt="" src="' + HtmlEscaper.escape(favicon) + '">';
    }
    return ChatIcons.globe;
  }

  static pageAttachment(r, tab) {
    const t = r.tab || tab;
    const host = TabContext.host(t.url);
    const body = ('URL: ' + t.url + '\n\n' + r.text).replace(/^```/gm, ' ```')
      + (r.truncated ? '\n\n[The page was longer; only the beginning is included.]' : '');
    return {
      kind: 'text',
      name: TabContext._cleanName(t.title, t.url),
      size: r.chars || r.text.length,
      text: body,
      language: 'markdown',
      truncated: !!r.truncated,
      source: host,
      page: { tabId: t.id, url: t.url, favicon: tab.favicon || null },
    };
  }

  static host(url) {
    try { return new URL(url).host || url; } catch (_) { return String(url || ''); }
  }

  static _cleanName(title, url) {
    const name = String(title || '').replace(/[[\]]/g, '').replace(/·/g, '-').trim();
    return name || TabContext.host(url);
  }

  static _key(t) {
    return t.id + '|' + t.url;
  }

  static _rowHtml(t, last) {
    const esc = HtmlEscaper.escape;
    return '<button type="button" class="cm-gear-row cm-tabs-row" data-tab-id="' + esc(String(t.id)) + '" title="' + esc(t.url) + '">'
      + '<span class="cm-gear-ic">' + TabContext.iconHtml(t.favicon) + '</span>'
      + '<span class="cm-tabs-text"><span class="cm-tabs-title">' + esc(TabContext._cleanName(t.title, t.url)) + '</span>'
      + '<span class="cm-tabs-host">' + esc(TabContext.host(t.url)) + '</span></span>'
      + (last ? '<span class="cm-tabs-badge">Last viewed</span>' : '')
      + '</button>';
  }

  _finish() {
    this.close();
    this._ctx.composer.focus();
  }

  _docClick(e) {
    const pop = this._ctx.root && this._ctx.root.querySelector('.cm-tabs-pop');
    if (!pop) { document.removeEventListener('click', this._onDocClick); return; }
    if (pop.contains(e.target) || (e.target.closest && e.target.closest('.cm-tabs-btn'))) return;
    this.close();
  }

  _listen() {
    if (this._listening) return;
    this._listening = true;
    window.addEventListener('focus', () => this.refreshSuggestion());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.refreshSuggestion(); });
  }
}
