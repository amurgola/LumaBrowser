export default class EditorStatus {
  constructor(el) {
    this._el = el;
  }

  show(text) {
    this._el.textContent = text;
    this._el.className = 'editor-status-text';
  }

  error(text) {
    this._el.textContent = text;
    this._el.className = 'editor-status-text error';
  }

  note(text) {
    this._el.textContent = text;
  }
}
