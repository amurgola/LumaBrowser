const path = require('path');
const AddonRendererModule = require('./AddonRendererModule');
const EsModuleSource = require('./EsModuleSource');
const ManifestDeps = require('./ManifestDeps');
const ManifestFields = require('./ManifestFields');
const ManifestHtmlFiles = require('./ManifestHtmlFiles');

class RendererExtensionList {
  static CORE_LABELS = { browser: 'Browser', database: 'Database', 'llm-service': 'LLM Service', llm: 'LLM Service' };
  static DEFAULT_VERSION = '1.0.0';
  static UNLOADED_RANK = 999;

  static build(ledger, disabled, { bundledDir = null } = {}) {
    const loaded = new Set(ledger.loadOrder);
    const bundledFolders = [...ledger.manifests.values()].filter((m) => !m._userInstalled && m._dir).map((m) => path.basename(m._dir));
    const context = { ledger, disabled, loaded, bundledDir, bundledFolders };
    const rows = [...ledger.manifests].map(([id, manifest]) => RendererExtensionList._row(id, manifest, context));
    return rows.sort(RendererExtensionList._compare);
  }

  static _row(id, manifest, { ledger, disabled, loaded, bundledDir, bundledFolders }) {
    ManifestHtmlFiles.resolve(manifest);
    const isDisabled = disabled.has(id);
    return {
      ...RendererExtensionList._identity(manifest),
      ...RendererExtensionList._surfaces(manifest),
      ...RendererExtensionList._rendererModule(manifest, bundledDir, bundledFolders),
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
      distributable: !!manifest.distributable,
    };
  }

  static _rendererModule(manifest, bundledDir, bundledFolders) {
    const isModule = !!(manifest.renderer && manifest._dir) && EsModuleSource.isModule(path.resolve(manifest._dir, manifest.renderer));
    if (!isModule || !manifest._userInstalled || !bundledDir) return { rendererModule: isModule };
    const { url, imports } = AddonRendererModule.describe(manifest, bundledDir, bundledFolders);
    return { rendererModule: true, rendererUrl: url, rendererImports: imports };
  }

  static _surfaces(manifest) {
    return {
      ui: manifest.ui || {},
      renderer: manifest.renderer || null,
      navigationBar: manifest.navigationBar || null,
      settings: manifest.settings || null,
      setupTab: manifest.setupTab ? { label: ManifestFields.option(manifest.setupTab, 'label') || manifest.name } : null,
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
