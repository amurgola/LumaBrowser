export default class HostLink {
  constructor(win) {
    this._win = win;
  }

  send(type, payload) {
    try {
      this._win.__lumaSend(JSON.stringify({ type, payload: payload || {} }));
    } catch (_) {}
  }
}
