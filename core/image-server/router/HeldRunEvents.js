class HeldRunEvents {
  static ERROR_EVENT = 'error';
  static DONE_EVENT = 'done';
  static ERROR_LEVEL = 'error';

  constructor(send, notify) {
    this._send = send;
    this._notify = notify;
    this._held = [];
    this.send = (type, payload) => this._pass(type, payload);
    this.notify = (message, level) => this._notifyOrHold(message, level);
  }

  release(result) {
    const held = this._held;
    this._held = [];
    for (const emit of held) emit();
    return result;
  }

  discard() {
    this._held = [];
  }

  _pass(type, payload) {
    if (HeldRunEvents._isFailure(type, payload)) this._held.push(() => this._send(type, payload));
    else this._send(type, payload);
  }

  static _isFailure(type, payload) {
    if (type === HeldRunEvents.ERROR_EVENT) return true;
    return type === HeldRunEvents.DONE_EVENT && !(payload && Array.isArray(payload.images) && payload.images.length);
  }

  _notifyOrHold(message, level) {
    if (level === HeldRunEvents.ERROR_LEVEL) this._held.push(() => this._notify(message, level));
    else this._notify(message, level);
  }
}

module.exports = HeldRunEvents;
