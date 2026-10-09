import HubWidgetStyles from './HubWidgetStyles.js';
import WidgetDom from './WidgetDom.js';

export default class HubWidgetBase {
  static REFRESH_EVENTS = [];
  static DEBOUNCE_MS = 250;
  static ATTENTION_AREA = null;
  static CONNECTION_EVENT = 'connection.changed';

  constructor(root, host) {
    this.root = root;
    this.host = host;
    this._data = null;
    this._detach = null;
    this._timer = null;
    this._disposed = false;
  }

  async mount() {
    HubWidgetStyles.ensure(this.root.ownerDocument);
    this.root.classList.add('hub-widget');
    this.root.innerHTML = '';
    this._renderShell();
    this._mountAttention();
    this._subscribe();
    await this.refresh();
    return () => this.dispose();
  }

  async refresh() {
    if (this._disposed) return;
    this._refreshAttention();
    try {
      this._data = await this._load();
      if (!this._disposed) {
        this._paint();
        this._showError('');
      }
    } catch (err) {
      this._showError(err);
    }
  }

  dispose() {
    this._disposed = true;
    clearTimeout(this._timer);
    if (this._detach) {
      try { this._detach(); } catch (_) {}
      this._detach = null;
    }
  }

  async act(fn) {
    try {
      await fn();
      await this.refresh();
    } catch (err) {
      this._showError(err);
    }
  }

  _renderShell() {
    throw new Error(`${this.constructor.name} must implement _renderShell()`);
  }

  _load() {
    throw new Error(`${this.constructor.name} must implement _load()`);
  }

  _paint() {
    throw new Error(`${this.constructor.name} must implement _paint()`);
  }

  _subscribe() {
    if (!this.host || typeof this.host.onEvent !== 'function') return;
    const wanted = new Set(this.constructor.REFRESH_EVENTS);
    const area = this.constructor.ATTENTION_AREA;
    this._detach = this.host.onEvent((event) => {
      if (!event) return;
      if (area && event.type === HubWidgetBase.CONNECTION_EVENT) this._refreshAttention();
      else if (wanted.has(event.type)) this._scheduleRefresh();
    });
  }

  _mountAttention() {
    if (!this.constructor.ATTENTION_AREA) return;
    const strip = WidgetDom.el('div', { class: 'hub-attention' });
    const head = this.root.querySelector('.hub-head');
    if (head && head.nextSibling) this.root.insertBefore(strip, head.nextSibling);
    else this.root.appendChild(strip);
  }

  async _refreshAttention() {
    const area = this.constructor.ATTENTION_AREA;
    const strip = area ? this.root.querySelector('.hub-attention') : null;
    if (!strip || !this.host || typeof this.host.call !== 'function') return;
    let rows = [];
    try {
      const listed = await this.host.call('listConnections');
      rows = ((listed && listed.connections) || []).filter((c) => (c.areas || []).includes(area) && (c.needsAttention || c.status === 'missing'));
    } catch (_) {
      rows = [];
    }
    if (this._disposed) return;
    strip.innerHTML = '';
    for (const row of rows) strip.appendChild(this._attentionRow(row));
  }

  _attentionRow(row) {
    const text = row.status === 'signed_out' ? `${row.name || row.appLabel} is signed out` : `${row.name || row.appLabel}: ${row.detail}`;
    return WidgetDom.el('div', { class: `hub-attention-row${row.needsAttention ? '' : ' is-warn'}`, title: row.detail || '' }, [
      WidgetDom.el('span', { class: 'hub-dot' }),
      WidgetDom.el('span', { class: 'hub-attention-text', text }),
      row.tabId != null ? WidgetDom.el('button', {
        type: 'button', class: 'hub-toggle', text: 'Sign in',
        on: { click: () => this.act(() => this.host.call('showConnectionTab', row.key)) },
      }) : null,
    ]);
  }

  _scheduleRefresh() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => { this.refresh(); }, this.constructor.DEBOUNCE_MS);
  }

  _showError(err) {
    const line = this.root.querySelector('.hub-error');
    if (!line) return;
    line.textContent = err ? String((err && err.message) || err) : '';
  }

  _errorLine() {
    return WidgetDom.el('div', { class: 'hub-error' });
  }

  _empty(text) {
    return WidgetDom.el('div', { class: 'hub-empty', text });
  }

  _openUrl(url) {
    if (!url) return;
    try {
      const opened = this.host.openTab(url);
      if (opened && typeof opened.catch === 'function') opened.catch((err) => this._showError(err));
    } catch (err) {
      this._showError(err);
    }
  }
}
