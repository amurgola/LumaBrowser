import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';
import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class RuntimeFixCard {
  constructor(ctx) {
    this._ctx = ctx;
    this._installing = false;
  }

  create(m) {
    const meta = m && m.errorMeta;
    if (!meta || meta.code !== 'RUNTIME_NOT_INSTALLED' || !meta.runtimeId) return null;
    const wrap = Dom.el('div', 'cm-fix');
    const name = meta.runtimeName || 'runtime';
    if (meta.installable === false) {
      wrap.appendChild(Dom.el('div', 'cm-fix-note',
        HtmlEscaper.escape(name + ' has no auto-installable build. Install it from Advanced / Setup.')));
      return wrap;
    }
    const btn = Dom.el('button', 'cm-fix-btn', ChatIcons.download + '<span>Download ' + HtmlEscaper.escape(name) + '</span>');
    const status = Dom.el('div', 'cm-fix-status');
    btn.addEventListener('click', () => this._install(m, meta, btn, status));
    wrap.appendChild(btn);
    wrap.appendChild(status);
    return wrap;
  }

  static progressText(type, p) {
    const fmt = (n) => ByteFormatter.bytes(n, { zero: '' });
    if (type === 'start') return 'Resolving release…';
    if (type === 'resolved') return 'Downloading ' + ((p.asset && p.asset.name) || '') + '…';
    if (type === 'download') {
      return p.total
        ? 'Downloading… ' + fmt(p.received) + ' / ' + fmt(p.total) + ' (' + Math.round((100 * p.received) / p.total) + '%)'
        : 'Downloading… ' + fmt(p.received);
    }
    if (type === 'extract') return p.phase === 'done' ? 'Verifying…' : 'Extracting…';
    if (type === 'finalize') return 'Installed. Retrying…';
    if (type === 'error') return 'Failed: ' + (p.message || 'unknown error');
    return null;
  }

  async _install(m, meta, btn, status) {
    const { api, state } = this._ctx;
    if (this._installing || state.streaming) return;
    this._installing = true;
    btn.disabled = true;
    btn.classList.add('busy');
    status.textContent = 'Starting…';
    const off = api.onRuntimeEvent(({ id, type, payload }) => {
      if (id !== meta.runtimeId) return;
      const text = RuntimeFixCard.progressText(type, payload || {});
      if (text != null) status.textContent = text;
    });
    try {
      await this._runInstall(m, meta, btn, status);
    } finally {
      if (typeof off === 'function') off();
      this._installing = false;
    }
  }

  async _runInstall(m, meta, btn, status) {
    try {
      const res = await this._ctx.api.installRuntime(meta.runtimeId);
      if (!res || !res.success) {
        RuntimeFixCard._fail(btn, status, (res && res.error) || 'unknown error');
        return;
      }
      status.textContent = 'Installed. Retrying…';
      this._ctx.sender.regenerate(m);
    } catch (err) {
      RuntimeFixCard._fail(btn, status, (err && err.message) || 'unknown error');
    }
  }

  static _fail(btn, status, reason) {
    status.textContent = 'Install failed: ' + reason;
    btn.disabled = false;
    btn.classList.remove('busy');
  }
}
