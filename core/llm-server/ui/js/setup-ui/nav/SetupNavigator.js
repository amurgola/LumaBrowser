export default class SetupNavigator {
  static GRID_VIEWS = new Set(['settings', 'image', 'music']);

  static HEADERS = {
    settings: { eyebrow: 'LLM Server', title: 'LLM Setup' },
    image: { eyebrow: 'Image Server', title: 'Image Generation' },
    music: { eyebrow: 'Music Server', title: 'Music Generation' },
    advanced: { eyebrow: 'LLM Server', title: 'Advanced' },
  };

  constructor({ doc = document, openers = {}, extensionTabs = null }) {
    this._doc = doc;
    this._openers = openers;
    this._extensionTabs = extensionTabs;
    this._pendingView = null;
  }

  start() {
    const nav = this._doc.getElementById('pageNav');
    if (nav) {
      nav.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-view]');
        if (btn && !btn.disabled) this.switchTo(btn.dataset.view);
      });
    }
    const initial = this._doc.querySelector('#pageNav button.active');
    if (initial) this.updateHeader(initial.dataset.view);
  }

  go(view) {
    if (!view) return false;
    let v = String(view);
    if (!SetupNavigator.HEADERS[v] && v.indexOf('ext:') !== 0) v = 'ext:' + v;
    if (!this._button(v)) { this._pendingView = v; return false; }
    this._pendingView = null;
    this.switchTo(v);
    return true;
  }

  flushPending() {
    if (this._pendingView) this.go(this._pendingView);
  }

  current() {
    const b = this._doc.querySelector('#pageNav button.active');
    return b ? b.dataset.view : null;
  }

  switchTo(name) {
    for (const b of this._doc.querySelectorAll('#pageNav button')) b.classList.toggle('active', b.dataset.view === name);
    this.updateHeader(name);
    this._showPanes(name);
    this._lazyOpen(name);
  }

  updateHeader(name) {
    const eyebrow = this._doc.getElementById('pageEyebrow');
    const title = this._doc.getElementById('pageTitle');
    if (!title) return;
    const preset = SetupNavigator.HEADERS[name];
    if (preset) {
      if (eyebrow) eyebrow.textContent = preset.eyebrow;
      title.textContent = preset.title;
      return;
    }
    const btn = this._button(name);
    if (eyebrow) eyebrow.textContent = 'Extension';
    title.textContent = (btn ? btn.textContent.trim() : name) || 'Setup';
  }

  _showPanes(name) {
    const grid = this._doc.querySelector('.grid');
    const inGrid = SetupNavigator.GRID_VIEWS.has(name);
    for (const pane of this._doc.querySelectorAll('[data-view-pane]')) {
      if (pane === grid) {
        pane.hidden = !inGrid;
        if (inGrid) pane.setAttribute('data-view-pane', name);
      } else {
        pane.hidden = pane.dataset.viewPane !== name;
      }
    }
  }

  _lazyOpen(name) {
    const opener = this._openers[name];
    if (typeof opener === 'function') { try { opener(); } catch (_) {} }
    if (name.indexOf('ext:') === 0 && this._extensionTabs) {
      try { this._extensionTabs.show(name.slice(4)); } catch (_) {}
    }
  }

  _button(view) {
    return Array.from(this._doc.querySelectorAll('#pageNav button[data-view]')).find((b) => b.dataset.view === view) || null;
  }
}
