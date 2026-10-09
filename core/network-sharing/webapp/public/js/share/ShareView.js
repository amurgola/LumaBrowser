import Dom from '../../../../../llm-server/ui/js/dom/Dom.js';
import HtmlEscaper from '../../../../../llm-server/ui/js/format/HtmlEscaper.js';
import ShareArtifacts from './ShareArtifacts.js';
import ShareTurnView from './ShareTurnView.js';

export default class ShareView {
  static TITLE = 'Shared conversation';
  static GONE = 'This share link is no longer available.';
  static EMPTY = 'This conversation has no messages.';
  static UNRENDERABLE = 'This conversation could not be rendered.';

  constructor({ win = window, doc = document } = {}) {
    this._win = win;
    this._doc = doc;
    this._exportData = ShareView.exportData(win);
    this._base = String(win.location.pathname || '').replace(/\/+$/, '');
    this._turns = new ShareTurnView(new ShareArtifacts({ base: this._base, exportMode: !!this._exportData }));
  }

  static exportData(win) {
    const data = win.__LUMA_EXPORT__;
    return data && typeof data === 'object' ? data : null;
  }

  async start() {
    if (this._exportData) return this._renderExport();
    try {
      const res = await this._win.fetch(this._base + '/data', { cache: 'no-store' });
      if (!res.ok) throw new Error('gone');
      this.render(await res.json());
    } catch (_) {
      this.fail(ShareView.GONE);
    }
    return undefined;
  }

  render(data) {
    if (!data || !data.success) throw new Error('gone');
    const conv = data.conversation || {};
    this._renderHeader(conv);
    if (this._exportData) this._renderExportChrome(data);
    const thread = this._thread();
    thread.innerHTML = '';
    const messages = Array.isArray(data.messages) ? data.messages : [];
    if (!messages.length) return this.fail(ShareView.EMPTY);
    for (const m of messages) {
      if (m.role === 'user' || m.role === 'assistant') thread.appendChild(this._turns.render(m));
    }
    return undefined;
  }

  fail(message) {
    const thread = this._thread();
    thread.innerHTML = '';
    thread.appendChild(Dom.el('div', 'sv-status', HtmlEscaper.escape(message)));
  }

  _renderExport() {
    try {
      this.render(this._exportData);
    } catch (_) {
      this.fail(ShareView.UNRENDERABLE);
    }
  }

  _renderHeader(conv) {
    this._doc.title = (conv.title || ShareView.TITLE) + ' - LumaBrowser';
    this._doc.getElementById('svTitle').textContent = conv.title || ShareView.TITLE;
    const when = conv.updatedAt || conv.createdAt;
    if (!when) return;
    try {
      this._doc.getElementById('svMeta').textContent = new Date(when).toLocaleString();
    } catch (_) {}
  }

  _renderExportChrome(data) {
    const badge = this._doc.querySelector('.sv-badge');
    if (badge) badge.textContent = ShareView._exportStamp(data.exportedAt);
    const foot = this._doc.querySelector('.sv-foot');
    if (foot) foot.textContent = 'Exported from LumaBrowser';
  }

  static _exportStamp(exportedAt) {
    let stamp = '';
    try {
      stamp = exportedAt ? new Date(exportedAt).toLocaleDateString() : '';
    } catch (_) {
      stamp = '';
    }
    return stamp ? 'exported ' + stamp : 'exported';
  }

  _thread() {
    return this._doc.getElementById('svThread');
  }
}
