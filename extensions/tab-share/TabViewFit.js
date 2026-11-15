class TabViewFit {
  constructor({ setViewSize } = {}) {
    this._setViewSize = setViewSize || (() => {});
    this._holder = null;
    this._applied = null;
  }

  holder() {
    return this._holder;
  }


  claim(viewer, size) {
    this._holder = viewer;
    return this._apply({ width: size.width, height: size.height });
  }

  release(viewer) {
    return this._holder === viewer && this.clear();
  }

  clear() {
    this._holder = null;
    return this._apply(null);
  }

  _apply(size) {
    if (TabViewFit._same(size, this._applied)) return false;
    this._applied = size;
    try { this._setViewSize(size); } catch (_) {}
    return true;
  }

  static _same(a, b) {
    if (!a || !b) return a === b;
    return a.width === b.width && a.height === b.height;
  }
}

module.exports = TabViewFit;
