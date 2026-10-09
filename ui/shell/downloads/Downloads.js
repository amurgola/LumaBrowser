import DownloadText from './DownloadText.js';
import DownloadsMenuHtml from './DownloadsMenuHtml.js';

export default class Downloads {
  static MENU_WIDTH = 320;

  constructor({ host, log }) {
    this._host = host;
    this._log = log;
    this._items = new Map();
    this.menuOpen = false;
    host.onHide(() => { this.menuOpen = false; });
    host.addDismissExemption((e) => this.menuOpen && Downloads._button() && Downloads._button().contains(e.target));
  }

  get size() {
    return this._items.size;
  }

  static supported() {
    return !!(window.tabAPI && typeof window.tabAPI.onDownload === 'function');
  }

  install() {
    const btn = Downloads._button();
    if (btn) {
      btn.hidden = true;
      btn.addEventListener('click', () => this.toggleMenu());
    }
    if (!Downloads.supported()) return;
    window.tabAPI.onDownload((p) => this.onEvent(p));
    if (typeof window.tabAPI.listDownloads === 'function') {
      window.tabAPI.listDownloads().then((list) => {
        for (const d of (Array.isArray(list) ? list : [])) this.onEvent(d);
      }).catch(() => {});
    }
  }

  onEvent(p) {
    if (!p || p.id == null) return;
    const id = String(p.id);
    const prev = this._items.get(id) || { id, startedAt: Date.now() };
    const next = Object.assign({}, prev, p, { id });
    this._items.set(id, next);
    this.refreshButton();
    if (this.menuOpen) this.showMenu();
    if (prev.state !== 'done' && next.state === 'done') this._log.add(`Download finished: ${next.filename || 'file'}`, 'success');
    else if (prev.state !== 'failed' && next.state === 'failed') this._log.add(`Download failed: ${next.filename || 'file'}`, 'error');
  }

  refreshButton() {
    const btn = Downloads._button();
    if (!btn) return;
    const list = [...this._items.values()];
    btn.hidden = list.length === 0;
    const active = list.filter((d) => d.state === 'progress');
    btn.classList.toggle('is-active', active.length > 0);
    const pct = active.length ? DownloadText.aggregatePercent(active) : 0;
    btn.style.setProperty('--dl-pct', String(pct));
    btn.title = active.length
      ? `Downloads (${active.length} in progress${pct ? `, ${pct}%` : ''})`
      : 'Downloads (Ctrl+J)';
  }

  toggleMenu() {
    if (this.menuOpen) { this._host.hide(); return; }
    if (!this._items.size) { this._log.add('No downloads yet', 'info'); return; }
    this.showMenu();
  }

  showMenu() {
    const btn = Downloads._button();
    if (!btn || !window.chromeOverlayAPI) return;
    this._host.hide();
    const width = Downloads.MENU_WIDTH;
    const r = btn.getBoundingClientRect();
    this._host.show('settings-menu', {
      html: DownloadsMenuHtml.render([...this._items.values()]),
      x: r.right - width,
      y: r.bottom + 6,
      width,
      estHeight: Math.max(60, this._items.size * 58 + 40),
    });
    this.menuOpen = true;
    this._host.armDismiss();
  }

  handleAction(payload) {
    const api = window.tabAPI || {};
    const id = payload && payload.id;
    const d = id != null ? this._items.get(String(id)) : null;
    if (!d) return;
    if (payload.action === 'open' && typeof api.openDownload === 'function') { api.openDownload(d.id); this._host.hide(); return; }
    if (payload.action === 'folder' && typeof api.showDownloadInFolder === 'function') { api.showDownloadInFolder(d.id); this._host.hide(); return; }
    if (payload.action === 'cancel' && typeof api.cancelDownload === 'function') api.cancelDownload(d.id);
  }

  static _button() {
    return document.getElementById('downloadsBtn');
  }
}
