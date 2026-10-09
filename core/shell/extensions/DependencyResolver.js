const LoadPriority = require('./LoadPriority');
const ManifestDeps = require('./ManifestDeps');

class DependencyResolver {
  constructor({ manifests, disabled, coreServices }) {
    this._manifests = manifests;
    this._disabled = disabled;
    this._coreServices = coreServices || {};
  }

  resolve() {
    this._setupPool();
    this._resolvePasses({ strict: true });
    this._resolvePasses({ strict: false });
    return { order: LoadPriority.sort(this._resolved, this._manifests), unmet: this._collectUnmet() };
  }

  _setupPool() {
    this._resolved = [];
    this._unresolved = new Set([...this._manifests.keys()].filter((id) => !this._disabled.has(id)));
  }

  _resolvePasses({ strict }) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const id of this._unresolved) {
        if (!this._check(id, strict).ok) continue;
        this._resolved.push(id);
        this._unresolved.delete(id);
        changed = true;
      }
    }
  }

  _check(id, strict) {
    const manifest = this._manifests.get(id);
    if (strict) {
      const pending = this._pendingOptional(manifest);
      if (pending) return { ok: false, pending };
    }
    return this._checkRequired(manifest);
  }

  _pendingOptional(manifest) {
    const extId = ManifestDeps.optionalExtIds(manifest).find((depId) => this._unresolved.has(depId));
    return extId ? `${ManifestDeps.EXT_PREFIX}${extId}` : null;
  }

  _checkRequired(manifest) {
    for (const depKey of Object.keys(ManifestDeps.required(manifest))) {
      if (ManifestDeps.isCore(depKey) && !ManifestDeps.coreService(this._coreServices, depKey)) {
        return { ok: false, missing: depKey };
      }
      if (ManifestDeps.isExt(depKey) && !this._resolved.includes(ManifestDeps.extId(depKey))) {
        return this._manifests.has(ManifestDeps.extId(depKey)) ? { ok: false, pending: depKey } : { ok: false, missing: depKey };
      }
    }
    return { ok: true };
  }

  _collectUnmet() {
    const unmet = new Map();
    for (const id of this._unresolved) {
      const result = this._check(id, false);
      unmet.set(id, result.missing || result.pending);
    }
    return unmet;
  }
}

module.exports = DependencyResolver;
