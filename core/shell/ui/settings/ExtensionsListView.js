export default class ExtensionsListView {
  static CONSTRAINTS_CHANNEL = 'core.shell.getToggleConstraints';

  static ERRORS_CHANNEL = 'core.shell.getExtensionErrors';

  constructor({ panes, meta, rowFactory, onShown }) {
    this._activePane = panes.extensions;
    this._inactivePane = panes.inactive || null;
    this._meta = meta;
    this._rowFactory = rowFactory;
    this._onShown = onShown;
  }

  isVisible() {
    return !!this._activePane && this._activePane.offsetParent !== null;
  }

  refreshIfVisible() {
    if (this.isVisible()) this.show();
  }

  async show() {
    if (!this._activePane) return;
    this._clearPanes();
    const constraints = await this._constraints();
    const errors = await this._errors();
    const entries = this._sortedEntries();
    const isEnabled = (ext) => (constraints[ext.id] ? constraints[ext.id].enabled : ext.enabled !== false);
    const active = entries.filter(isEnabled);
    const inactive = entries.filter((ext) => !isEnabled(ext));
    this._setCount(active.length);
    const build = (list, emptyMessage) => this._listView(list, emptyMessage, constraints, errors);
    this._swapPanes(
      build(active, entries.length === 0 ? 'No extensions installed' : 'No active extensions'),
      build(inactive, 'No inactive extensions'),
    );
    this._onShown();
  }

  _clearPanes() {
    this._activePane.innerHTML = '';
    if (this._inactivePane) this._inactivePane.innerHTML = '';
  }

  async _constraints() {
    try {
      return (await window.ipcBridge.invoke(ExtensionsListView.CONSTRAINTS_CHANNEL)) || {};
    } catch (e) {
      console.warn('UISlotManager: failed to fetch toggle constraints:', e.message);
      return {};
    }
  }

  async _errors() {
    const byId = new Map();
    try {
      const errs = await window.ipcBridge.invoke(ExtensionsListView.ERRORS_CHANNEL);
      for (const err of (Array.isArray(errs) ? errs : [])) {
        if (!err || !err.extensionId) continue;
        if (!byId.has(err.extensionId)) byId.set(err.extensionId, []);
        byId.get(err.extensionId).push(err);
      }
    } catch (e) {
      console.warn('UISlotManager: failed to fetch extension errors:', e.message);
    }
    return byId;
  }

  _sortedEntries() {
    return this._meta.values().sort((a, b) => {
      if (a.enabled && !b.enabled) return -1;
      if (!a.enabled && b.enabled) return 1;
      return (a.loadOrder || 0) - (b.loadOrder || 0);
    });
  }

  _setCount(count) {
    const badge = document.getElementById('extActiveCountBadge');
    if (badge) badge.textContent = String(count);
  }

  _listView(list, emptyMessage, constraints, errors) {
    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'luma-empty';
      empty.textContent = emptyMessage;
      return empty;
    }
    const view = document.createElement('div');
    view.className = 'ext-list-view';
    for (const ext of list) view.appendChild(this._rowFactory.build(ext, constraints, errors.get(ext.id) || []));
    return view;
  }

  _swapPanes(activeView, inactiveView) {
    this._activePane.innerHTML = '';
    this._activePane.appendChild(activeView);
    if (this._inactivePane) {
      this._inactivePane.innerHTML = '';
      this._inactivePane.appendChild(inactiveView);
    }
  }
}
