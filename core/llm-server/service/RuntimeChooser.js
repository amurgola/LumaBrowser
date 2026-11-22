const ModelRuntimeResolver = require('../runtimes/ModelRuntimeResolver');
const RuntimeFrameworks = require('../runtimes/RuntimeFrameworks');

class RuntimeChooser {
  static PREFERRED_BUILDS = Object.freeze(['llama-cpp-luma']);

  constructor({ selection, catalog, legacyRuntimeId, hostOrder }) {
    this._selection = selection;
    this._catalog = catalog;
    this._legacyRuntimeId = legacyRuntimeId;
    this._hostOrder = hostOrder;
  }

  forModel(model, { runtimesView, diagnostics = null, usable } = {}) {
    return ModelRuntimeResolver.resolve({
      model,
      rows: (runtimesView && runtimesView.runtimes) || [],
      selection: this._selection,
      legacyRuntimeId: this._legacyRuntimeId(),
      order: this.buildOrder(diagnostics, runtimesView),
      ...(usable ? { usable } : {}),
    });
  }

  buildOrder(diagnostics, runtimesView) {
    return RuntimeChooser.PREFERRED_BUILDS.concat(this._hostOrder(diagnostics, runtimesView) || []);
  }

  activate(runtimeId) {
    const entry = runtimeId ? this._catalog.getById(runtimeId) : null;
    if (!entry) return false;
    this._selection.setActiveBuild(RuntimeFrameworks.frameworkIdOf(entry), entry.id);
    return true;
  }
}

module.exports = RuntimeChooser;
