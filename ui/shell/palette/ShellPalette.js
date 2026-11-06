export default class ShellPalette {
  constructor({ host, reveal, actions, store, feedback = null, settingsEl = null }) {
    this._feedback = feedback;
    this._host = host;
    this._reveal = reveal;
    this._actions = actions;
    this._store = store;
    this._settingsEl = settingsEl;
  }

  install() {
    this._wireSwitch();
    document.addEventListener('settings:open', (e) => this._rememberTab(e && e.detail && e.detail.tab));
    const el = this._settingsEl || document.getElementById('settingsModal');
    if (el) {
      el.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('.settings-tab[data-tab]');
        if (btn) this._rememberTab(btn.dataset.tab, btn.textContent);
      });
    }
  }

  async _wireSwitch() {
    const toggle = document.getElementById('gsPaletteShift');
    if (!toggle) return;
    const r = await ShellPalette._invoke('core.palette.getDoubleShift');
    toggle.checked = !(r && r.enabled === false);
    toggle.addEventListener('change', async () => {
      const res = await ShellPalette._invoke('core.palette.setDoubleShift', toggle.checked);
      if (this._feedback) this._feedback.markSaved(toggle, !!(res && res.success), res && res.error);
    });
  }

  handleForwarded(p) {
    if (!p) return false;
    if (p.action === 'open-palette') { this.toggle(); return true; }
    if (p.action === 'palette-reveal') { this._reveal.reveal(p.target).catch(() => {}); return true; }
    if (p.action === 'palette-run' && p.run) { this._actions.handle(p.run, this._store.activeTabId); return true; }
    return false;
  }

  toggle() {
    if (this._host && this._host.mode) this._host.hide();
    return ShellPalette._invoke('core.palette.toggle');
  }

  _rememberTab(tab, label) {
    if (!tab) return;
    const btn = document.querySelector(`.settings-tab[data-tab="${String(tab).replace(/"/g, '')}"]`);
    const name = String(label || (btn && btn.textContent) || tab).trim();
    ShellPalette._invoke('core.palette.record', { kind: 'settings', ref: String(tab), title: name });
  }

  static _invoke(channel, ...args) {
    const bridge = window.ipcBridge;
    if (!bridge || typeof bridge.invoke !== 'function') return Promise.resolve(null);
    return Promise.resolve(bridge.invoke(channel, ...args)).catch(() => null);
  }
}
