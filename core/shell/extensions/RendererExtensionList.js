const ManifestDeps = require('./ManifestDeps');
const ManifestFields = require('./ManifestFields');
const ManifestHtmlFiles = require('./ManifestHtmlFiles');

class RendererExtensionList {
  static CORE_LABELS = { browser: 'Browser', database: 'Database', 'llm-service': 'LLM Service', llm: 'LLM Service' };
  static DEFAULT_VERSION = '1.0.0';
  static UNLOADED_RANK = 999;

  static build(ledger, disabled) {
    const loaded = new Set(ledger.loadOrder);
    const rows = [...ledger.manifests].map(([id, manifest]) => RendererExtensionList._row(id, manifest, ledger, disabled, loaded));
    return rows.sort(RendererExtensionList._compare);
  }

  static _row(id, manifest, ledger, disabled, loaded) {
    ManifestHtmlFiles.resolve(manifest);
    const isDisabled = disabled.has(id);
    return {
      ...RendererExtensionList._identity(manifest),
      ...RendererExtensionList._surfaces(manifest),
      dependencies: RendererExtensionList._dependencies(manifest, ledger),
      loadOrder: ledger.loadOrder.indexOf(id),
      enabled: !isDisabled,
      loadable: isDisabled ? false : loaded.has(id),
      unmetDependency: ledger.unmetDeps.get(id) || null,
    };
  }

  static _identity(manifest) {
    return {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version || RendererExtensionList.DEFAULT_VERSION,
      description: manifest.description || '',
      dir: manifest._dir,
      userInstalled: !!manifest._userInstalled,
      debugOnly: manifest.debugOnly || false,
      private: manifest.private || false,
      distributable: !!manifest.distributable,
    };
  }

  static _surfaces(manifest) {
    return {
      ui: manifest.ui || {},
      renderer: manifest.renderer || null,
      navigationBar: manifest.navigationBar || null,
      settings: manifest.settings || null,
      setupTab: manifest.setupTab ? { label: ManifestFields.option(manifest.setupTab, 'label') || manifest.name } : null,
      extensionsAction: manifest.extensionsAction || null,
      extensionsActions: ManifestFields.actions(manifest),
    };
  }

  static _dependencies(manifest, ledger) {
    const required = ManifestDeps.required(manifest);
    return Object.entries(ManifestDeps.all(manifest)).map(([depKey, config]) => {
      const isCore = ManifestDeps.isCore(depKey);
      const depName = depKey.replace(ManifestDeps.CORE_PREFIX, '').replace(ManifestDeps.EXT_PREFIX, '');
      return {
        key: depKey,
        name: isCore ? (RendererExtensionList.CORE_LABELS[depName] || depName) : depName,
        isCore,
        isRequired: !!required[depKey],
        installed: ManifestDeps.isExt(depKey) ? ledger.manifests.has(depName) : true,
        reason: (config && config.reason) || '',
        hasSlots: !!(config && config.slots && config.slots.length > 0),
      };
    });
  }

  static _compare(a, b) {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return RendererExtensionList._rank(a) - RendererExtensionList._rank(b);
  }

  static _rank(row) {
    return row.loadOrder >= 0 ? row.loadOrder : RendererExtensionList.UNLOADED_RANK;
  }
}

module.exports = RendererExtensionList;
