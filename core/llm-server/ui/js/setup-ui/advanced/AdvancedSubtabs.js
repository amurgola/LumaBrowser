export default class AdvancedSubtabs {
  static TITLES = { server: 'System Diagnostics', data: 'Chat Data', placement: 'Model Placement' };

  constructor(doc = document) {
    this._doc = doc;
    this.current = 'placement';
  }

  wire(onWired) {
    const strip = this._doc.getElementById('advSubtabs');
    if (!strip || strip.dataset.wired) return false;
    strip.dataset.wired = '1';
    strip.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-subtab]');
      if (b) this.apply(b.dataset.subtab);
    });
    if (onWired) onWired();
    return true;
  }

  apply(name) {
    const root = this._doc.getElementById('advancedRoot');
    if (!root) return;
    this.current = name;
    root.querySelectorAll('#advSubtabs button[data-subtab]').forEach((b) => b.classList.toggle('active', b.dataset.subtab === name));
    root.querySelectorAll('[data-subtab-pane]').forEach((p) => { p.hidden = p.dataset.subtabPane !== name; });
    const title = this._doc.getElementById('pageTitle');
    if (title) title.textContent = AdvancedSubtabs.TITLES[name] || AdvancedSubtabs.TITLES.placement;
  }
}
