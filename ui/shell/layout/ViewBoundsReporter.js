import ViewBoundsMath from './ViewBoundsMath.js';

export default class ViewBoundsReporter {
  static OVERLAY_SELECTORS = [
    '#settingsModal',
    '#setupWizardModal',
    '#aiActivityPanel',
    '#notificationLog',
    '#aiChatPanel',
    '#aiChatConfirmModal',
    '#extensionBottomBar',
    '#historyModal',
    '#bookmarkManagerModal',
    '.lm-overlay',
  ];

  constructor(container) {
    this._container = container;
    this._scheduled = false;
    this._lastSent = null;
    this._overlays = new Set();
    this._selector = ViewBoundsReporter.OVERLAY_SELECTORS.join(',');
  }

  get lastSent() {
    return this._lastSent;
  }

  queue() {
    if (this._scheduled) return;
    this._scheduled = true;
    requestAnimationFrame(() => this._flush());
  }

  computeBounds() {
    const base = this._container.getBoundingClientRect();
    const overlays = [];
    for (const selector of ViewBoundsReporter.OVERLAY_SELECTORS) {
      const el = document.querySelector(selector);
      if (ViewBoundsReporter.isOverlayVisible(el)) overlays.push(el.getBoundingClientRect());
    }
    return ViewBoundsMath.compute(base, overlays);
  }

  install() {
    if (!this._container) return;
    this._resizeObserver = new ResizeObserver(() => this.queue());
    this._resizeObserver.observe(this._container);
    this._resizeObserver.observe(document.body);
    window.addEventListener('resize', () => this.queue());
    this._syncOverlays();
    new MutationObserver((records) => this._onMutations(records)).observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
      subtree: true,
      childList: true,
    });
  }

  static isOverlayVisible(el) {
    if (!el || el.hidden) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  _flush() {
    this._scheduled = false;
    if (!this._container || !window.tabAPI) return;
    const next = this.computeBounds();
    if (ViewBoundsReporter._same(this._lastSent, next)) return;
    this._lastSent = next;
    window.tabAPI.setBounds(next);
  }

  static _same(a, b) {
    return !!a && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  }

  _syncOverlays() {
    const current = new Set(document.querySelectorAll(this._selector));
    for (const el of this._overlays) {
      if (!current.has(el)) { this._resizeObserver.unobserve(el); this._overlays.delete(el); }
    }
    for (const el of current) {
      if (!this._overlays.has(el)) { this._overlays.add(el); this._resizeObserver.observe(el); }
    }
  }

  _onMutations(records) {
    let changed = false;
    let membershipChanged = false;
    for (const record of records) {
      if (record.type === 'childList') {
        if (this._touchesOverlay(record)) membershipChanged = changed = true;
        continue;
      }
      const target = record.target;
      if (target.matches(this._selector) && !this._overlays.has(target)) membershipChanged = changed = true;
      if (this._containsOverlay(target)) changed = true;
    }
    if (membershipChanged) this._syncOverlays();
    if (changed) this.queue();
  }

  _touchesOverlay(record) {
    for (const node of [...record.addedNodes, ...record.removedNodes]) {
      if (node.nodeType === 1 && (node.matches(this._selector) || node.querySelector(this._selector))) return true;
    }
    return false;
  }

  _containsOverlay(target) {
    for (const el of this._overlays) {
      if (target === el || target.contains(el)) return true;
    }
    return false;
  }
}
