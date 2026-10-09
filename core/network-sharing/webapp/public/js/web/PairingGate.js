export default class PairingGate {
  static EXPIRED = 'Pairing expired. Enter the PIN again.';
  static ENDED = 'Pairing ended. Enter the PIN again.';
  static LOAD_FAILED = 'Chat UI failed to load. Refresh the page.';
  static CONNECT_FAILED = 'Could not connect.';
  static CONNECTING = 'Connecting…';
  static CONNECT = 'Connect';
  static DEFAULT_HOST = 'LumaBrowser';

  constructor({ api, chatApi, chatMode, doc, win }) {
    this._api = api;
    this._chatApi = chatApi;
    this._chatMode = chatMode;
    this._doc = doc;
    this._win = win;
    this._mounted = false;
  }

  async start() {
    this._wirePinForm();
    this._win.addEventListener('luma-unauthorized', () => this._onUnauthorized());
    await this._showHostName();
    await this.tryEnter();
  }

  async tryEnter() {
    if (!this._api.getToken()) return this._showGate();
    try {
      await this._api.listModels();
    } catch (e) {
      if (e && e.unauthorized) {
        this._api.setToken(null);
        return this._showGate(PairingGate.EXPIRED);
      }
    }
    this._enter();
  }

  async submitPin() {
    const pin = this._byId('pair-pin');
    const value = (pin.value || '').trim();
    if (!value) return;
    const btn = this._byId('pair-btn');
    this._setBusy(btn, true);
    try {
      await this._api.pair(value);
      pin.value = '';
      this._enter();
    } catch (e) {
      this._showError((e && e.message) || PairingGate.CONNECT_FAILED);
    } finally {
      this._setBusy(btn, false);
    }
  }

  _wirePinForm() {
    this._byId('pair-btn').addEventListener('click', () => this.submitPin());
    this._byId('pair-pin').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.submitPin(); });
  }

  async _showHostName() {
    try {
      const meta = await this._api.info();
      this._byId('pair-host').textContent = (meta && meta.name) || PairingGate.DEFAULT_HOST;
    } catch (_) {}
  }

  _onUnauthorized() {
    this._api.setToken(null);
    this._showGate(PairingGate.ENDED);
  }

  _enter() {
    this._hideGate();
    this._mountChat();
  }

  _mountChat() {
    if (this._mounted) return this._chatMode.show();
    if (!this._chatMode || typeof this._chatMode.mount !== 'function') return this._showGate(PairingGate.LOAD_FAILED);
    this._doc.body.classList.add('chat-mode');
    this._chatMode.mount(this._byId('chatRoot'), this._chatApi);
    this._chatMode.show();
    this._mounted = true;
    return undefined;
  }

  _showGate(message) {
    this._byId('pair-view').style.display = 'flex';
    if (message) this._showError(message);
  }

  _hideGate() {
    this._byId('pair-view').style.display = 'none';
  }

  _showError(message) {
    const el = this._byId('pair-error');
    el.textContent = message;
    el.style.display = 'block';
  }

  _setBusy(btn, busy) {
    btn.disabled = busy;
    btn.textContent = busy ? PairingGate.CONNECTING : PairingGate.CONNECT;
    if (busy) this._byId('pair-error').style.display = 'none';
  }

  _byId(id) {
    return this._doc.getElementById(id);
  }
}
