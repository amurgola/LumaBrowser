const DatabaseService = require('../../database/DatabaseService');
const ExtensionEventBus = require('./ExtensionEventBus');
const ManifestDeps = require('./ManifestDeps');

class ExtensionContextFactory {
  static CORE_PROPERTIES = { browser: 'core:browser', llm: 'core:llm-service' };
  static BASE_KEYS = ['extensionId', 'extensionDir', 'db', 'sharedServices', 'ipc', 'logger', 'extensions', 'events', 'expose'];

  constructor({ coreServices, ipcBridge, ledger, surfaces }) {
    this._coreServices = coreServices;
    this._ipcBridge = ipcBridge || null;
    this._ledger = ledger;
    this._surfaces = surfaces;
  }

  reservedKeys() {
    return new Set([
      ...ExtensionContextFactory.BASE_KEYS,
      ...Object.keys(ExtensionContextFactory.CORE_PROPERTIES),
      ...this._surfaces.map((surface) => surface.key),
    ]);
  }

  build(manifest, registry) {
    const context = this._baseContext(manifest, registry);
    this._addCoreServices(context, manifest);
    this._addSurfaces(context, manifest);
    this._addDependencyShortcuts(context);
    return context;
  }

  _baseContext(manifest, registry) {
    const id = manifest.id;
    return {
      extensionId: id,
      extensionDir: manifest._dir,
      db: this._dbAccess(manifest),
      sharedServices: this._coreServices,
      ipc: this._ipcBridge ? this._ipcBridge.forExtension(id) : null,
      logger: this._logger(manifest),
      extensions: this._dependencyApis(manifest),
      events: new ExtensionEventBus(),
      expose: registry.expose.bind(registry),
    };
  }

  _addCoreServices(context, manifest) {
    for (const [property, depKey] of Object.entries(ExtensionContextFactory.CORE_PROPERTIES)) {
      context[property] = ManifestDeps.declaredCoreService(manifest, this._coreServices, depKey);
    }
  }

  _addSurfaces(context, manifest) {
    for (const surface of this._surfaces) context[surface.key] = surface.forExtension(manifest.id, manifest);
  }

  _addDependencyShortcuts(context) {
    const reserved = this.reservedKeys();
    for (const [depId, api] of Object.entries(context.extensions)) {
      if (reserved.has(depId)) {
        console.warn(`ExtensionManager: cannot add context.${depId} - reserved name. Use context.extensions['${depId}'] instead.`);
        continue;
      }
      context[depId] = api;
    }
  }

  _dbAccess(manifest) {
    if (!ManifestDeps.declares(manifest, 'core:database')) return null;
    const rawDb = this._coreServices.database;
    if (!rawDb) return null;
    return new DatabaseService(rawDb, `ext.${manifest.id}`, ManifestDeps.declaredTables(manifest));
  }

  _logger(manifest) {
    const activityLog = this._coreServices.activityLog;
    if (!activityLog) return null;
    return activityLog.forCaller(`ext.${manifest.id}`, { label: manifest.name || manifest.id, description: manifest.description || '' });
  }

  _dependencyApis(manifest) {
    const apis = {};
    for (const depId of ManifestDeps.extIds(manifest)) {
      const ext = this._ledger.extensions.get(depId);
      if (ext) apis[depId] = ext.api;
    }
    return apis;
  }
}

module.exports = ExtensionContextFactory;
