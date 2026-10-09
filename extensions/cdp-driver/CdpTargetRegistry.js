class CdpTargetRegistry {
  constructor() {
    this._targets = new Map();
    this._byTab = new Map();
  }

  add(target) {
    this._targets.set(target.targetId, target);
    if (target.tabId != null) this._byTab.set(target.tabId, target.targetId);
    return target;
  }

  get(targetId) { return this._targets.get(targetId) || null; }

  byTab(tabId) {
    const targetId = this._byTab.get(tabId);
    return targetId ? this._targets.get(targetId) : null;
  }

  delete(targetId) {
    const target = this._targets.get(targetId);
    if (!target) return;
    this._targets.delete(targetId);
    if (target.tabId != null) this._byTab.delete(target.tabId);
  }

  all() { return [...this._targets.values()]; }

  clear() {
    this._targets.clear();
    this._byTab.clear();
  }
}

module.exports = CdpTargetRegistry;
