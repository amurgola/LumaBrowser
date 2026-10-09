import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class SidebarModes {
  constructor(ctx) {
    this._ctx = ctx;
  }

  list(where) {
    const ext = this._ctx.chatExt();
    const modes = ext && typeof ext.list === 'function' ? (ext.list() || []) : [];
    return modes.filter((m) => !m.hidden && (m.launcher === 'sidebar' ? 'sidebar' : 'landing') === where);
  }

  render() {
    const { els } = this._ctx;
    if (!els.sideModes) return;
    const sub = this.list('landing');
    const util = this.list('sidebar');
    if (!sub.length && !util.length) { els.sideModes.innerHTML = ''; return; }
    els.sideModes.innerHTML = SidebarModes._trayHtml(sub) + util.map((m) => SidebarModes.rowHtml(m, '')).join('');
    els.sidebar.classList.toggle('has-new-modes', sub.length > 0);
    els.sideModes.querySelectorAll('[data-mode]').forEach((b) => {
      b.addEventListener('click', () => this._ctx.launcher.start(b.dataset.mode));
    });
    this.applyActive();
  }

  applyActive() {
    const { els, state } = this._ctx;
    if (!els.sideModes) return;
    els.sideModes.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.activeMode));
    if (state.activeId || state.activeTaskId || state.activeTriggerId) state.newModesOpen = false;
    const open = state.newModesOpen;
    const sub = els.sideModes.querySelector('.cm-side-new-modes');
    if (sub) sub.classList.toggle('open', open);
    const chev = els.sidebar && els.sidebar.querySelector('.cm-new-chev');
    if (chev) { chev.classList.toggle('open', open); chev.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    const row = els.sidebar && els.sidebar.querySelector('.cm-new-row');
    if (row) row.classList.toggle('open', open);
  }

  static rowHtml(m, extraCls) {
    const esc = HtmlEscaper.escape;
    const label = m.label || m.id;
    const isLogo = typeof m.icon === 'string' && /^\s*<svg[\s>]/i.test(m.icon);
    const ic = isLogo
      ? '<span class="cm-mode-ic cm-mode-logo">' + m.icon + '</span>'
      : '<span class="cm-mode-ic cm-mode-initial">' + esc(label.trim().charAt(0).toUpperCase()) + '</span>';
    return '<button type="button" class="cm-icon-btn cm-side-mode' + (extraCls ? ' ' + extraCls : '')
      + '" data-mode="' + esc(m.id) + '" title="' + esc(m.description || label) + '">'
      + ic + '<span class="cm-label">' + esc(label) + '</span></button>';
  }

  static _trayHtml(sub) {
    if (!sub.length) return '';
    return '<div class="cm-side-new-modes"><div class="cm-side-new-inner">'
      + sub.map((m) => SidebarModes.rowHtml(m, 'cm-side-mode-sub')).join('')
      + '</div></div>';
  }
}
