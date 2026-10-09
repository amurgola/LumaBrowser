const Accelerators = require('../browser/Accelerators');

class OnDemandKeyboard {
  constructor({ tabViewManager, lookup, isExpanded, collapse }) {
    this._tvm = tabViewManager;
    this._lookup = lookup;
    this._isExpanded = isExpanded;
    this._collapse = collapse;
  }

  handle(event, input) {
    if (!input || input.type !== 'keyDown') return;
    if (this._foldOnEscape(event, input)) return;
    this._forwardAccelerator(event, input);
  }

  _foldOnEscape(event, input) {
    if (input.key !== 'Escape' || !this._isExpanded()) return false;
    event.preventDefault();
    this._collapse();
    return true;
  }

  _forwardAccelerator(event, input) {
    const entry = this._lookup.activeEntry();
    const action = Accelerators.match(input, { loading: Boolean(entry && entry.loading) });
    if (!action || !entry) return;
    event.preventDefault();
    try {
      this._performInMain(entry, action);
      this._notifyShell(entry, action);
    } catch (_) {}
  }

  _performInMain(entry, action) {
    if (!Accelerators.MAIN_HANDLED.has(action)) return;
    if (typeof this._tvm.performAccelerator === 'function') this._tvm.performAccelerator(entry, action);
  }

  _notifyShell(entry, action) {
    if (typeof this._tvm.sendToRenderer === 'function') {
      this._tvm.sendToRenderer('tab-view:accelerator', { action, tabId: entry.id });
    }
  }
}

module.exports = OnDemandKeyboard;
