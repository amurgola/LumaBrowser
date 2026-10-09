export default class LiteConfirm {
  constructor({ modal, message, okBtn, cancelBtn }) {
    this._modal = modal;
    this._message = message;
    this._okBtn = okBtn;
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.hide());
  }

  isOpen() {
    return !!(this._modal && this._modal.classList.contains('active'));
  }

  show(text, onOk) {
    if (!this._modal) {
      if (window.confirm(text)) onOk();
      return;
    }
    this._message.textContent = text;
    this._modal.classList.add('active');
    this._okBtn.onclick = () => { this.hide(); onOk(); };
  }

  hide() {
    if (this._modal) this._modal.classList.remove('active');
    if (this._okBtn) this._okBtn.onclick = null;
  }
}
