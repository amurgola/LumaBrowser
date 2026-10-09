const fs = require('fs');
const ExtensionLedger = require('./extensions/ExtensionLedger');
const DisabledExtensions = require('./extensions/DisabledExtensions');
const ManifestScanner = require('./extensions/ManifestScanner');
const DependencyResolver = require('./extensions/DependencyResolver');
const ExtensionContextFactory = require('./extensions/ExtensionContextFactory');
const ExtensionActivator = require('./extensions/ExtensionActivator');
const ExtensionWiring = require('./extensions/ExtensionWiring');
const ExtensionTeardown = require('./extensions/ExtensionTeardown');
const HotInstaller = require('./extensions/HotInstaller');
const ExtensionRemover = require('./extensions/ExtensionRemover');
const ToggleConstraints = require('./extensions/ToggleConstraints');
const RendererExtensionList = require('./extensions/RendererExtensionList');
const RendererSource = require('./extensions/RendererSource');
const CapabilitiesSnapshot = require('./extensions/CapabilitiesSnapshot');
const ChatSurface = require('./extensions/ChatSurface');
const SetupTabSurface = require('./extensions/SetupTabSurface');
const ImageCatalogSurface = require('./extensions/ImageCatalogSurface');
const LlmCatalogSurface = require('./extensions/LlmCatalogSurface');
const VoiceSurface = require('./extensions/VoiceSurface');
const CodeSurface = require('./extensions/CodeSurface');

class ExtensionManager {
  constructor({ extensionsDir, userExtensionsDir, coreServices, ipcBridge, restGateway, mcpAggregator, registries, chat }) {
    this.extensionsDir = extensionsDir;
    this.userExtensionsDir = userExtensionsDir || null;
    this.coreServices = coreServices || {};
    this.ipcBridge = ipcBridge || null;
    this.restGateway = restGateway || null;
    this.mcpAggregator = mcpAggregator || null;
    this._ledger = new ExtensionLedger();
    this._disabled = new DisabledExtensions(this.coreServices.database);
    this._registries = registries || ExtensionTeardown.sharedRegistries();
    this._ensureUserExtensionsDir();
    this._buildCollaborators(chat);
  }

  get manifests() { return this._ledger.manifests; }

  get extensions() { return this._ledger.extensions; }

  get loadOrder() { return this._ledger.loadOrder; }

  get unmetDeps() { return this._ledger.unmetDeps; }

  get disabledSet() { return this._disabled.set; }

  discover() {
    const found = this._scanner().scan();
    this._ledger.manifests.clear();
    for (const [id, manifest] of found) this._ledger.manifests.set(id, manifest);
    return this._ledger.manifests;
  }

  resolve() {
    const { order, unmet } = new DependencyResolver({
      manifests: this._ledger.manifests, disabled: this._disabled.set, coreServices: this.coreServices,
    }).resolve();
    this._ledger.setLoadOrder(order);
    this._ledger.unmetDeps = unmet;
    this._logResolution(order, unmet);
    return order;
  }

  async activate() {
    if (this._disabled.refresh()) this.resolve();
    for (const id of [...this._ledger.loadOrder]) await this._activateAtBoot(id);
    console.log(`ExtensionManager: ${this._ledger.extensions.size} extension(s) activated`);
  }

  async disableExtension(id) {
    const refusal = this._disableRefusal(id);
    if (refusal) return { success: false, error: refusal };
    await this._teardown.teardown(id, this._ledger.extensions.get(id));
    this._ledger.extensions.delete(id);
    this._ledger.removeFromLoadOrder(id);
    this._disabled.add(id);
    console.log(`ExtensionManager: disabled "${id}" at runtime`);
    return { success: true, id };
  }

  async enableExtension(id) {
    const refusal = this._enableRefusal(id);
    if (refusal) return { success: false, error: refusal };
    this._disabled.remove(id);
    try {
      await this._activator.activate(id);
      this._afterRuntimeActivation(id);
      console.log(`ExtensionManager: enabled "${id}" at runtime`);
      return { success: true, id };
    } catch (err) {
      this._disabled.add(id);
      console.error(`ExtensionManager: failed to enable "${id}":`, err.message);
      return { success: false, error: err.message };
    }
  }

  isDeletable(id) {
    const manifest = this._ledger.manifests.get(id);
    return !!(manifest && manifest._userInstalled);
  }

  deleteExtension(id) {
    return this._remover.remove(id);
  }

  hotInstallExtension(dir) {
    return this._hotInstaller.install(dir);
  }

  getCapabilitiesSnapshot(excludeId = null) {
    return this._capabilities.build(excludeId);
  }

  getToggleConstraints() {
    return ToggleConstraints.compute(this._ledger);
  }

  getRendererExtensionList() {
    return RendererExtensionList.build(this._ledger, this._disabled);
  }

  getRendererSource(id) {
    return RendererSource.read(id, this._ledger.manifests.get(id));
  }

  getApi(id) {
    const ext = this._ledger.extensions.get(id);
    return ext ? ext.api : null;
  }

  getExtension(id) {
    return this._ledger.extensions.get(id) || null;
  }

  codeSurfaceFor(extensionId) {
    return this._codeSurface.forExtension(extensionId);
  }

  async deactivate() {
    for (const id of [...this._ledger.loadOrder].reverse()) {
      const ext = this._ledger.extensions.get(id);
      if (ext && await ExtensionTeardown.runDeactivate(id, ext.instance)) console.log(`ExtensionManager: deactivated "${id}"`);
    }
    this._ledger.extensions.clear();
    this._ledger.setLoadOrder([]);
  }

  getErrors() {
    return this._ledger.errors;
  }

  _ensureUserExtensionsDir() {
    if (!this.userExtensionsDir) return;
    try {
      fs.mkdirSync(this.userExtensionsDir, { recursive: true });
    } catch (err) {
      console.warn(`ExtensionManager: could not create user extensions dir: ${err.message}`);
    }
  }

  _buildCollaborators(chat) {
    const ledger = this._ledger;
    const onError = (extensionId, phase, error) => ledger.recordError(extensionId, phase, error);
    const disable = (id) => this.disableExtension(id);
    this._codeSurface = this._buildCodeSurface();
    this._contexts = new ExtensionContextFactory({
      coreServices: this.coreServices, ipcBridge: this.ipcBridge, ledger, surfaces: this._buildSurfaces(chat),
    });
    const wiring = new ExtensionWiring({
      restGateway: this.restGateway, mcpAggregator: this.mcpAggregator, setupTabs: this._registries.setupTabs, onError,
    });
    this._activator = new ExtensionActivator({ ledger, contexts: this._contexts, wiring });
    this._teardown = new ExtensionTeardown({
      coreServices: this.coreServices, ipcBridge: this.ipcBridge, mcpAggregator: this.mcpAggregator,
      restGateway: this.restGateway, registries: this._registries,
    });
    this._hotInstaller = new HotInstaller({
      ledger, disabled: this._disabled, coreServices: this.coreServices, activator: this._activator, restGateway: this.restGateway, disable,
    });
    this._remover = new ExtensionRemover({ ledger, disabled: this._disabled, userExtensionsDir: this.userExtensionsDir, disable });
    this._capabilities = new CapabilitiesSnapshot({
      coreServices: this.coreServices, mcpAggregator: this.mcpAggregator, restGateway: this.restGateway, ledger,
    });
  }

  _buildSurfaces(chat) {
    const r = this._registries;
    return [
      chat || new ChatSurface({ registry: r.chatModes }),
      new SetupTabSurface({ registry: r.setupTabs }),
      new ImageCatalogSurface({ registry: r.imageCatalog }),
      new LlmCatalogSurface({ runtimes: r.runtimeCatalog, models: r.modelCatalog, coreServices: this.coreServices }),
      new VoiceSurface({ registry: r.ttsEngines, coreServices: this.coreServices }),
      this._codeSurface,
    ];
  }

  _buildCodeSurface() {
    return new CodeSurface({
      userExtensionsDir: this.userExtensionsDir,
      coreServices: this.coreServices,
      manifests: this._ledger.manifests,
      install: (dir) => this.hotInstallExtension(dir),
      capabilities: (excludeId) => this.getCapabilitiesSnapshot(excludeId),
    });
  }

  _scanner() {
    return new ManifestScanner({
      roots: [{ dir: this.extensionsDir, userInstalled: false }, { dir: this.userExtensionsDir, userInstalled: true }],
      skipDebugOnly: ExtensionManager._isProductionBuild(),
      onError: (extensionId, phase, error) => this._ledger.recordError(extensionId, phase, error),
    });
  }

  static _isProductionBuild() {
    if (process.env.LUMA_DOCKER) return true;
    try {
      const { app } = require('electron');
      return !!(app && app.isPackaged);
    } catch (_) {
      return false;
    }
  }

  _logResolution(order, unmet) {
    for (const [id, reason] of unmet) console.warn(`ExtensionManager: cannot load "${id}" - unmet dependency: ${reason}`);
    const disabledCount = [...this._disabled.set].filter((id) => this._ledger.manifests.has(id)).length;
    if (disabledCount > 0) console.log(`ExtensionManager: ${disabledCount} extension(s) disabled, skipped`);
    console.log(`ExtensionManager: load order: [${order.join(', ')}]`);
  }

  async _activateAtBoot(id) {
    await new Promise((resolve) => setImmediate(resolve));
    const started = Date.now();
    try {
      await this._activator.activate(id);
      ExtensionManager._bootStamp(`${id} activated in ${Date.now() - started}ms`);
    } catch (err) {
      ExtensionManager._bootStamp(`${id} FAILED after ${Date.now() - started}ms: ${err.message}`);
      console.error(`ExtensionManager: failed to activate "${id}":`, err.message);
      this._ledger.recordError(id, 'activation', err.message);
    }
  }

  static _bootStamp(message) {
    const bootStart = global.__LUMA_BOOT_START;
    if (bootStart) console.log(`[luma-boot +${Date.now() - bootStart}ms] ext: ${message}`);
    else console.log(`ExtensionManager: ${message}`);
  }

  _disableRefusal(id) {
    if (!this._ledger.isActive(id)) return `Extension "${id}" is not currently active`;
    const dependent = this._ledger.activeDependentOf(id);
    return dependent ? `Cannot disable "${id}" - required by "${dependent.name}". Disable it first.` : null;
  }

  _enableRefusal(id) {
    const manifest = this._ledger.manifests.get(id);
    if (!manifest) return `Extension "${id}" not found`;
    if (this._ledger.isActive(id)) return `Extension "${id}" is already enabled`;
    const missing = this._ledger.firstInactiveRequirement(manifest);
    return missing ? `Cannot enable "${id}" - requires "${this._ledger.nameOf(missing)}" to be enabled first` : null;
  }

  _afterRuntimeActivation(id) {
    if (this.restGateway) this.restGateway.enableExtension(id);
    this._ledger.insertIntoLoadOrder(id);
  }
}

module.exports = ExtensionManager;
