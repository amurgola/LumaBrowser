export default class HubSection {
  constructor(tab) {
    this._tab = tab;
    this._root = null;
  }

  html() {
    throw new Error(`${this.constructor.name} must implement html()`);
  }

  bind(container) {
    this._root = container;
  }

  async load() {}

  unbind() {
    this._root = null;
  }

  invoke(channel, ...args) {
    return this._tab.invoke(channel, ...args);
  }

  async call(channel, ...args) {
    const reply = await this.invoke(channel, ...args);
    if (reply && reply.success === false) throw new Error(reply.error || `${channel} failed`);
    return reply || {};
  }

  $(id) {
    return this._root ? this._root.querySelector(`#ext-hub-${id}`) : null;
  }

  $$(selector) {
    return this._root ? [...this._root.querySelectorAll(selector)] : [];
  }

  async act(fn, successMessage = '') {
    try {
      await fn();
      if (successMessage) this._tab.notify(successMessage, true);
      await this.load();
    } catch (err) {
      this._tab.notify((err && err.message) || String(err), false);
    }
  }
}
