const LoadPriority = require('./LoadPriority');
const ManifestDeps = require('./ManifestDeps');

class ExtensionLedger {
  constructor() {
    this.manifests = new Map();
    this.extensions = new Map();
    this.loadOrder = [];
    this.errors = [];
    this.unmetDeps = new Map();
  }

  recordError(extensionId, phase, error) {
    this.errors.push({ extensionId, phase, error });
  }

  isActive(id) {
    return this.extensions.has(id);
  }

  setLoadOrder(ids) {
    this.loadOrder.splice(0, this.loadOrder.length, ...ids);
  }

  insertIntoLoadOrder(id) {
    LoadPriority.insert(this.loadOrder, id, this.manifests);
  }

  removeFromLoadOrder(id) {
    const index = this.loadOrder.indexOf(id);
    if (index >= 0) this.loadOrder.splice(index, 1);
  }

  activeDependentOf(id) {
    for (const [otherId, other] of this.extensions) {
      if (otherId !== id && ManifestDeps.requiresExt(other.manifest, id)) return other.manifest;
    }
    return null;
  }

  firstInactiveRequirement(manifest) {
    return ManifestDeps.requiredExtIds(manifest).find((depId) => !this.isActive(depId)) || null;
  }

  nameOf(id) {
    const manifest = this.manifests.get(id);
    return manifest ? manifest.name : id;
  }
}

module.exports = ExtensionLedger;
