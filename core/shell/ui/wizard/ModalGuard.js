export default class ModalGuard {
  constructor(modalEl) {
    this._modalEl = modalEl;
    this._onKeydown = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
    };
    this._onMousedown = (e) => {
      if (e.target !== this._modalEl) return;
      e.preventDefault();
      e.stopPropagation();
    };
  }

  attach() {
    document.addEventListener('keydown', this._onKeydown, true);
    this._modalEl.addEventListener('mousedown', this._onMousedown);
  }

  detach() {
    document.removeEventListener('keydown', this._onKeydown, true);
    this._modalEl.removeEventListener('mousedown', this._onMousedown);
  }
}
