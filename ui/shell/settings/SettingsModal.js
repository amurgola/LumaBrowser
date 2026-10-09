export default class SettingsModal {
  constructor({ bounds, feedback, getSlotManager }) {
    this._bounds = bounds;
    this._feedback = feedback;
    this._getSlotManager = getSlotManager;
    this.el = document.getElementById('settingsModal');
  }

  install() {
    document.getElementById('settingsCloseBtn')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close();
    });
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    this.el.addEventListener('click', (e) => this._onGotoLink(e));
  }

  isOpen() {
    return !!this.el && this.el.classList.contains('active');
  }

  open(tab = 'general') {
    this.el.classList.add('active');
    if (tab) this.switchTab(tab);
    document.dispatchEvent(new CustomEvent('settings:open', { detail: { tab } }));
    this._bounds.queue();
  }

  close() {
    if (!this.isOpen()) return;
    this.el.classList.remove('active');
    this._feedback.hideToast();
    document.dispatchEvent(new CustomEvent('settings:close'));
  }

  hideQuietly() {
    this.el.classList.remove('active');
  }

  switchTab(tab) {
    const slots = this._getSlotManager();
    if (slots && typeof slots.switchSettingsTab === 'function') slots.switchSettingsTab(tab);
  }

  _onGotoLink(e) {
    const link = e.target.closest && e.target.closest('[data-gs-goto]');
    if (!link) return;
    e.preventDefault();
    const tab = link.getAttribute('data-gs-goto');
    if (tab) this.switchTab(tab);
  }
}
