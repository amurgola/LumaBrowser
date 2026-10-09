class IdeInstaller {
  static INSTALL_FAILED = 'install failed';
  static REMOVE_FAILED = 'remove failed';

  available() {
    throw new Error(`${this.constructor.name} must implement available()`);
  }

  sourceVersion() {
    throw new Error(`${this.constructor.name} must implement sourceVersion()`);
  }

  detectIdes() {
    throw new Error(`${this.constructor.name} must implement detectIdes()`);
  }

  status() {
    return {
      available: this.available(),
      ...this._statusDetails(),
      sourceVersion: this.sourceVersion(),
      ides: this.detectIdes(),
    };
  }

  async install(ids) {
    if (!this.available()) throw new Error(this._notBundledMessage());
    const { done, failed } = await this._applyToTargets(ids, (ide) => this._installInto(ide), this.constructor.INSTALL_FAILED);
    return { installed: done, failed, ides: this.detectIdes() };
  }

  async uninstall(ids) {
    const { done, failed } = await this._applyToTargets(ids, (ide) => this._removeFrom(ide), this.constructor.REMOVE_FAILED);
    return { removed: done, failed, ides: this.detectIdes() };
  }

  async refreshIfInstalled() {
    if (!this.available()) return [];
    const done = [];
    for (const ide of this._staleIdes()) {
      try {
        await this._installInto(ide);
        done.push(ide.id);
      } catch (_) {}
    }
    return done;
  }

  _statusDetails() {
    return {};
  }

  _notBundledMessage() {
    throw new Error(`${this.constructor.name} must implement _notBundledMessage()`);
  }

  _installInto() {
    throw new Error(`${this.constructor.name} must implement _installInto(ide)`);
  }

  _removeFrom() {
    throw new Error(`${this.constructor.name} must implement _removeFrom(ide)`);
  }

  _staleIdes() {
    throw new Error(`${this.constructor.name} must implement _staleIdes()`);
  }

  _targets(ids) {
    const all = this.detectIdes();
    if (!Array.isArray(ids) || !ids.length) return all;
    const wanted = new Set(ids.map(String));
    return all.filter((ide) => wanted.has(ide.id));
  }

  async _applyToTargets(ids, action, fallbackError) {
    const done = [];
    const failed = [];
    for (const ide of this._targets(ids)) {
      try {
        await action(ide);
        done.push(ide.id);
      } catch (e) {
        failed.push({ id: ide.id, error: (e && e.message) || fallbackError });
      }
    }
    return { done, failed };
  }
}

module.exports = IdeInstaller;
