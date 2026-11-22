class DefaultRuntimeFollower {
  constructor({ service, scanner }) {
    this._svc = service;
    this._scanner = scanner;
  }

  async resolve() {
    const modelPath = this._svc.getDefaults().modelPath;
    const model = modelPath ? await this._scannedModel(modelPath) : null;
    if (!model) return null;
    const outcome = this._svc.runtimeChooser.forModel(model, {
      runtimesView: await this._svc.ensureRuntimesView(),
      diagnostics: await this._svc.ensureDiagnostics(),
    });
    const runtime = outcome.runtime || null;
    return { modelPath, runtimeId: runtime ? runtime.id : null, frameworkId: outcome.frameworkId || null, why: outcome.why || null };
  }

  async follow() {
    const current = await this.resolve();
    if (!current || !current.runtimeId) return current ? { ...current, changed: false } : null;
    const changed = current.runtimeId !== this._svc.getDefaults().runtimeId;
    if (changed) this._svc.setDefaults({ runtimeId: current.runtimeId });
    return { ...current, changed };
  }

  async _scannedModel(modelPath) {
    const scan = await this._scanner.scan(this._svc.getModelsDirConfig().effectivePath);
    return ((scan && scan.models) || []).find((model) => model.weights && model.weights[0] && model.weights[0].path === modelPath) || null;
  }
}

module.exports = DefaultRuntimeFollower;
