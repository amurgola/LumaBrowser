const path = require('path');
const ExtensionUrls = require('./ExtensionUrls');
const ManifestFields = require('./ManifestFields');
const McpToolSetMerger = require('./McpToolSetMerger');
const SetupTabRegistry = require('../../llm-server/chat/SetupTabRegistry');

class ExtensionWiring {
  static LOOPBACK = '127.0.0.1';

  constructor({ restGateway, mcpAggregator, setupTabs = SetupTabRegistry.shared, onError = () => {} }) {
    this._restGateway = restGateway || null;
    this._mcpAggregator = mcpAggregator || null;
    this._setupTabs = setupTabs;
    this._onError = onError;
  }

  wire({ id, manifest, context, api, registry }) {
    this._registerChatModes(id, manifest, context);
    this._registerSetupTab(id, manifest);
    this._registerRoutes(id, manifest, context, api);
    this._mountExposedRoutes(id, registry);
    this._registerMcpTools(id, manifest, registry);
  }

  _registerChatModes(id, manifest, context) {
    if (!manifest.chatModes) return;
    try {
      const chatUiUrl = ExtensionWiring._chatUiUrl(id, manifest);
      for (const descriptor of ExtensionWiring._chatModeDescriptors(manifest, context)) {
        if (!descriptor) continue;
        if (chatUiUrl && !descriptor.chatUiUrl) descriptor.chatUiUrl = chatUiUrl;
        if (chatUiUrl && descriptor.chatUiUrl === chatUiUrl) descriptor.chatUiModule = ExtensionWiring.isModuleBundle(manifest);
        context.chat.registerMode(descriptor);
      }
    } catch (err) {
      console.error(`ExtensionManager: failed to load chatModes for "${id}":`, err.message);
      this._onError(id, 'chatModes', err.message);
    }
  }

  _registerSetupTab(id, manifest) {
    const definition = manifest.setupTab;
    if (!definition) return;
    try {
      const uiFile = ManifestFields.file(definition);
      this._setupTabs.register({
        id: ManifestFields.option(definition, 'id') || id,
        label: ManifestFields.option(definition, 'label') || id,
        url: uiFile ? ExtensionUrls.uiAsset(id, uiFile) : null,
        module: uiFile ? ExtensionWiring.isModuleBundle(manifest) : false,
      }, id);
    } catch (err) {
      console.error(`ExtensionManager: failed to register setupTab for "${id}":`, err.message);
      this._onError(id, 'setupTab', err.message);
    }
  }

  _registerRoutes(id, manifest, context, api) {
    if (!manifest.routes || !this._restGateway) return;
    const factory = require(path.resolve(manifest._dir, ManifestFields.file(manifest.routes)));
    const prefix = ManifestFields.option(manifest.routes, 'prefix');
    this._restGateway.registerExtension(id, { factory, prefix }, this._routeContext(id, context, api));
  }

  _routeContext(id, context, api) {
    const gateway = this._restGateway;
    return {
      ...context,
      extensionApi: api,
      gateway: {
        registerUpgrade: (suffix, handler) => gateway.registerExtensionUpgrade(id, suffix, handler),
        port: gateway.port,
        baseUrl: `http://${ExtensionWiring.LOOPBACK}:${gateway.port}`,
      },
    };
  }

  _mountExposedRoutes(id, registry) {
    if (!registry.hasRegistrations() || !this._restGateway) return;
    const router = registry.buildExpressRouter();
    if (router) this._restGateway.mountExposedRoutes(id, router);
  }

  _registerMcpTools(id, manifest, registry) {
    const merged = McpToolSetMerger.merge(ExtensionWiring._manualMcpTools(manifest), registry.buildMcpToolSet());
    if (merged && this._mcpAggregator) this._mcpAggregator.registerExtension(id, merged);
  }

  static _chatModeDescriptors(manifest, context) {
    let exported = require(path.resolve(manifest._dir, ManifestFields.file(manifest.chatModes)));
    if (typeof exported === 'function') exported = exported(context);
    return Array.isArray(exported) ? exported : [exported];
  }

  static isModuleBundle(manifest) {
    return !manifest._userInstalled && manifest.distributable !== true;
  }

  static _chatUiUrl(id, manifest) {
    const uiFile = ManifestFields.file(manifest.chatUi);
    return uiFile ? ExtensionUrls.uiAsset(id, uiFile) : null;
  }

  static _manualMcpTools(manifest) {
    if (!manifest.mcpTools) return null;
    return require(path.resolve(manifest._dir, ManifestFields.file(manifest.mcpTools)));
  }
}

module.exports = ExtensionWiring;
