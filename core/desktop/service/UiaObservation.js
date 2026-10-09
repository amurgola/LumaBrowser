class UiaObservation {
  static NOT_OBSERVED = 'Refs come from desktop_observe of THIS window; observe it first.';

  constructor() {
    this._nodes = new Map();
    this._hwnd = null;
  }

  record(hwnd, nodes) {
    this._nodes.set(hwnd, nodes);
    this._hwnd = hwnd;
  }

  isFor(hwnd) {
    return this._hwnd === hwnd;
  }

  node(hwnd, ref) {
    return (this._nodes.get(hwnd) || []).find((n) => n.ref === ref) || null;
  }
}

module.exports = UiaObservation;
