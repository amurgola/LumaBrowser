export default class MobileModelInfo {
  static MOBILE_QUERY = '(max-width: 760px)';
  static TITLE = 'Connection info';

  constructor({ api, win }) {
    this._api = api;
    this._win = win;
  }

  install(doc) {
    doc.addEventListener('click', (e) => this.onClick(e), true);
  }

  onClick(e) {
    if (!this._win.matchMedia(MobileModelInfo.MOBILE_QUERY).matches) return;
    const pill = e.target.closest && e.target.closest('.cm-model-pill');
    if (!pill) return;
    e.preventDefault();
    e.stopPropagation();
    this._show(MobileModelInfo.message(MobileModelInfo._modelName(pill), this._hostName()));
  }

  static message(model, host) {
    return 'Model: ' + model + '  ·  Host: ' + host
      + '.   The AI runs on the host; this device is a remote view, so the model is selected on the host.';
  }

  static _modelName(pill) {
    const b = pill.querySelector('b');
    return (b && b.textContent && b.textContent.trim()) || 'Unknown';
  }

  _hostName() {
    return (this._api && this._api.getHostName && this._api.getHostName()) || 'LumaBrowser';
  }

  _show(text) {
    const modal = this._win.LumaModal;
    if (modal && modal.alert) modal.alert(text, { title: MobileModelInfo.TITLE });
    else this._win.alert(text);
  }
}
