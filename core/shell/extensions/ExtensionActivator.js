const path = require('path');
const ExposeRegistry = require('../ExposeRegistry');
const ManifestDeps = require('./ManifestDeps');

class ExtensionActivator {
  constructor({ ledger, contexts, wiring }) {
    this._ledger = ledger;
    this._contexts = contexts;
    this._wiring = wiring;
  }

  async activate(id) {
    const manifest = this._ledger.manifests.get(id);
    if (!manifest.main) {
      this._recordRendererOnly(id, manifest);
      return;
    }
    const extModule = require(path.resolve(manifest._dir, manifest.main));
    const registry = new ExposeRegistry(id);
    const context = this._contexts.build(manifest, registry);
    ExtensionActivator._registerLlmSlots(id, manifest, context);
    const api = await ExtensionActivator._runActivate(extModule, context);
    registry.seal();
    this._ledger.extensions.set(id, { manifest, instance: extModule, api });
    this._wiring.wire({ id, manifest, context, api, registry });
    console.log(`ExtensionManager: activated "${id}"`);
  }

  _recordRendererOnly(id, manifest) {
    this._ledger.extensions.set(id, { manifest, instance: null, api: {} });
  }

  static _registerLlmSlots(id, manifest, context) {
    if (!context.llm) return;
    for (const slot of ManifestDeps.llmSlots(manifest)) {
      context.llm.registerSlot(`${id}.${slot.id}`, { extensionId: id, label: slot.label, required: slot.required !== false });
    }
  }

  static async _runActivate(extModule, context) {
    if (typeof extModule.activate !== 'function') return {};
    return (await extModule.activate(context)) || {};
  }
}

module.exports = ExtensionActivator;
