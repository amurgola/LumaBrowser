export default class Unauthorized extends Error {
  static EVENT = 'luma-unauthorized';

  constructor(message, win = globalThis.window) {
    super(message || 'Pairing required');
    this.unauthorized = true;
    Unauthorized._announce(win);
  }

  static _announce(win) {
    try {
      win.dispatchEvent(new win.Event(Unauthorized.EVENT));
    } catch (_) {}
  }
}
