export default class RuntimeStatusStore {
  constructor() {
    this._byId = new Map();
    this._updates = new Map();
  }

  setView(view) {
    this._byId.clear();
    for (const r of view.runtimes) this._byId.set(r.id, r);
  }

  get(id) {
    return this._byId.get(id) || null;
  }

  isInstalled(id) {
    const r = this._byId.get(id);
    return !!(r && r.installed);
  }

  all() {
    return [...this._byId.values()];
  }

  installedInference() {
    return this.all().filter((r) => r.kind === 'inference' && r.installed);
  }

  claimedModelKinds() {
    const claimed = new Set();
    for (const r of this._byId.values()) for (const k of (r.modelKinds || [])) claimed.add(k);
    return claimed;
  }

  setUpdate(id, info) {
    this._updates.set(id, info);
  }

  update(id) {
    return this._updates.get(id) || null;
  }
}
