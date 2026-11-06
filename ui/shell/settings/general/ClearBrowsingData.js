export default class ClearBrowsingData {
  static ANCHOR = 'gsClearData';

  constructor({ feedback, historyModal = null }) {
    this._feedback = feedback;
    this._history = historyModal;
  }

  install() {
    const $ = (id) => document.getElementById(id);
    this._el = {
      range: $('gsClearRange'), history: $('gsClearHistory'), cookies: $('gsClearCookies'), cache: $('gsClearCache'),
      downloads: $('gsClearDownloads'), btn: $('gsClearDataBtn'),
    };
    if (!this._el.btn || !window.ipcBridge) return false;
    this._el.btn.addEventListener('click', () => this.clear());
    return true;
  }

  selection() {
    const e = this._el;
    return {
      range: e.range.value,
      history: e.history.checked,
      cookies: e.cookies.checked,
      cache: e.cache.checked,
      downloads: e.downloads.checked,
    };
  }

  static summary(cleared) {
    const names = { history: 'history', cookies: 'cookies and site data', cache: 'cache', downloads: 'downloads list' };
    const parts = (cleared || []).map((c) => names[c] || c);
    return parts.length ? `Cleared ${parts.join(', ')}` : 'Nothing selected';
  }

  async clear() {
    const what = this.selection();
    if (!what.history && !what.cookies && !what.cache && !what.downloads) { this._feedback.toast('Pick what to clear', 'bad'); return; }
    this._el.btn.disabled = true;
    try {
      const res = await window.ipcBridge.invoke('core.browsingData.clear', what);
      if (res && res.success) {
        this._feedback.toast(ClearBrowsingData.summary(res.cleared), 'ok');
        if (what.history && this._history && this._history.isOpen()) this._history.refresh();
      } else {
        this._feedback.toast((res && res.error) || 'Could not clear', 'bad');
      }
    } finally {
      this._el.btn.disabled = false;
    }
  }

  static reveal() {
    const el = document.getElementById(ClearBrowsingData.ANCHOR);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center' });
  }
}
