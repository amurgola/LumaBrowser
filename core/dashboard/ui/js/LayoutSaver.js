export default class LayoutSaver {
  static DEBOUNCE_MS = 400;

  constructor(api, grid) {
    this._api = api;
    this._grid = grid;
    this._timer = null;
  }

  schedule() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.save(), LayoutSaver.DEBOUNCE_MS);
  }

  flush() {
    clearTimeout(this._timer);
    this.save();
  }

  save() {
    const items = this._grid.layoutItems();
    if (!items) return;
    this._api.layout.set(items).catch(() => {});
  }
}
