export default class ImageModal {
  static OVERLAY = 'img-modal-wrap';

  constructor() {
    this.wrap = null;
    this._onKey = (event) => { if (event.key === 'Escape' && this._isTopmost()) this.close(); };
  }

  _isTopmost() {
    const overlays = document.querySelectorAll(`.${ImageModal.OVERLAY}`);
    return overlays[overlays.length - 1] === this.wrap;
  }

  isOpen() {
    return !!this.wrap;
  }

  show(innerHtml) {
    const wrap = document.createElement('div');
    wrap.className = `luma-modal-overlay ${ImageModal.OVERLAY}`;
    wrap.innerHTML = innerHtml;
    document.body.appendChild(wrap);
    this.wrap = wrap;
    document.addEventListener('keydown', this._onKey);
    wrap.addEventListener('click', (event) => { if (event.target === wrap) this.close(); });
    wrap.querySelectorAll('[data-act="close"]').forEach((b) => b.addEventListener('click', () => this.close()));
    return wrap;
  }

  close() {
    document.removeEventListener('keydown', this._onKey);
    if (this.wrap) { this.wrap.remove(); this.wrap = null; }
  }

  setError(message) {
    const line = this.wrap && this.wrap.querySelector('.img-modal-err');
    if (!line) return;
    line.textContent = message || '';
    line.classList.toggle('bad', !!message);
  }

  static resetButton(button, label) {
    button.disabled = false;
    button.textContent = label;
  }
}
