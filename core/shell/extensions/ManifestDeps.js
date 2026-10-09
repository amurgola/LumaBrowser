class ManifestDeps {
  static CORE_SERVICE_KEYS = { 'llm-service': 'llm' };
  static CORE_PREFIX = 'core:';
  static EXT_PREFIX = 'ext:';

  static required(manifest) {
    return (manifest.dependencies && manifest.dependencies.required) || {};
  }

  static optional(manifest) {
    return (manifest.dependencies && manifest.dependencies.optional) || {};
  }

  static all(manifest) {
    return { ...ManifestDeps.required(manifest), ...ManifestDeps.optional(manifest) };
  }

  static declares(manifest, depKey) {
    return !!(ManifestDeps.required(manifest)[depKey] || ManifestDeps.optional(manifest)[depKey]);
  }

  static declaration(manifest, depKey) {
    return ManifestDeps.required(manifest)[depKey] || ManifestDeps.optional(manifest)[depKey] || {};
  }

  static isCore(depKey) {
    return depKey.startsWith(ManifestDeps.CORE_PREFIX);
  }

  static isExt(depKey) {
    return depKey.startsWith(ManifestDeps.EXT_PREFIX);
  }

  static extId(depKey) {
    return depKey.slice(ManifestDeps.EXT_PREFIX.length);
  }

  static coreServiceKey(depKey) {
    const name = depKey.slice(ManifestDeps.CORE_PREFIX.length);
    return ManifestDeps.CORE_SERVICE_KEYS[name] || name;
  }

  static coreService(coreServices, depKey) {
    return (coreServices && coreServices[ManifestDeps.coreServiceKey(depKey)]) || null;
  }

  static declaredCoreService(manifest, coreServices, depKey) {
    return ManifestDeps.declares(manifest, depKey) ? ManifestDeps.coreService(coreServices, depKey) : null;
  }

  static requiredExtIds(manifest) {
    return Object.keys(ManifestDeps.required(manifest)).filter(ManifestDeps.isExt).map(ManifestDeps.extId);
  }

  static optionalExtIds(manifest) {
    return Object.keys(ManifestDeps.optional(manifest)).filter(ManifestDeps.isExt).map(ManifestDeps.extId);
  }

  static extIds(manifest) {
    return Object.keys(ManifestDeps.all(manifest)).filter(ManifestDeps.isExt).map(ManifestDeps.extId);
  }

  static requiresExt(manifest, extId) {
    return !!ManifestDeps.required(manifest)[`${ManifestDeps.EXT_PREFIX}${extId}`];
  }

  static llmSlots(manifest) {
    const llm = ManifestDeps.required(manifest)['core:llm-service'];
    return (llm && Array.isArray(llm.slots)) ? llm.slots : [];
  }

  static declaredTables(manifest) {
    const tables = ManifestDeps.declaration(manifest, 'core:database').tables || [];
    return tables.map((table) => (typeof table === 'string' ? table : table.name));
  }
}

module.exports = ManifestDeps;
