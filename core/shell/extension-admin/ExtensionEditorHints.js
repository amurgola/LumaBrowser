const ExtensionAutocompleteData = require('../ExtensionAutocompleteData');

class ExtensionEditorHints {
  static CONTEXT_PROPS = [
    ['core:database', 'db'],
    ['core:browser', 'browser'],
    ['core:llm-service', 'llm'],
  ];

  constructor(extensionManager) {
    this._extensions = extensionManager;
  }

  build(extId) {
    return { ...ExtensionAutocompleteData.build(this._extensionApis()), contextHints: extId ? this._contextHints(extId) : null };
  }

  _extensionApis() {
    const apis = {};
    if (this._extensions.extensions) {
      for (const [id, ext] of this._extensions.extensions) apis[id] = { manifest: ext.manifest || {}, api: ext.api || {} };
    }
    if (this._extensions.manifests) {
      for (const [id, manifest] of this._extensions.manifests) if (!apis[id]) apis[id] = { manifest, api: {} };
    }
    return apis;
  }

  _contextHints(extId) {
    const manifest = this._manifest(extId);
    if (!manifest) return null;
    const deps = manifest.dependencies || {};
    const required = deps.required || {};
    const optional = deps.optional || {};
    const all = { ...required, ...optional };
    return {
      availableContextProps: ExtensionEditorHints.CONTEXT_PROPS.filter(([cap]) => required[cap] || optional[cap]).map(([, prop]) => prop),
      extensionDependencies: Object.keys(all).filter((k) => k.startsWith('ext:')).map((k) => this._dependency(k.replace('ext:', ''))),
    };
  }

  _dependency(depId) {
    const m = this._manifest(depId);
    return { id: depId, name: m ? m.name : depId, description: m ? m.description : '' };
  }

  _manifest(id) {
    const manifests = this._extensions.manifests;
    return manifests && manifests.get ? manifests.get(id) || null : null;
  }
}

module.exports = ExtensionEditorHints;
