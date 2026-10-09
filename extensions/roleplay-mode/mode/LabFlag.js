class LabFlag {
  static KEY = 'ext.roleplay-mode.labEnabled';
  static TAB = { id: 'roleplay-lab', label: 'Roleplay Lab', file: './rp-lab.js' };

  constructor(rawDb, setupTab) {
    this._db = rawDb;
    this._setupTab = setupTab;
  }

  enabled() {
    return !!(this._db && this._db.get(LabFlag.KEY, false));
  }

  set(on) {
    if (this._db) this._db.set(LabFlag.KEY, !!on);
    this.apply(!!on);
    return { enabled: this.enabled() };
  }

  apply(on) {
    if (!this._setupTab) return;
    if (on) this._setupTab.register(Object.assign({}, LabFlag.TAB));
    else if (typeof this._setupTab.unregister === 'function') this._setupTab.unregister(LabFlag.TAB.id);
  }
}

module.exports = LabFlag;
