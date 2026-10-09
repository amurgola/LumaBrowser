export default class WizardTimers {
  constructor() {
    this._ids = [];
  }

  add(id) {
    this._ids.push(id);
    return id;
  }

  clear() {
    while (this._ids.length) clearInterval(this._ids.pop());
  }
}
