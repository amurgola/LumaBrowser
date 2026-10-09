class LaunchContext {
  constructor({ service, planFor, withVision = false }) {
    this.service = service;
    this.withVision = !!withVision;
    this.defaults = service.getDefaults();
    this.settingsDb = service.settingsDb;
    this._planFor = planFor;

    this.diag = null;
    this.runtimeRow = null;
    this.runtime = null;
    this.model = null;
    this.catalogEntry = null;
    this.launchKey = null;
    this.port = null;

    this.kvMode = null;
    this.userArgs = '';
    this.overrides = null;
    this.layout = null;

    this.cudaDevice = null;
    this.tensorSplit = null;
    this.planDiag = null;
    this.rpcAcquired = false;
    this.launch = null;
  }

  plan({ diagnostics = this.diag, overrides = this.overrides, runtime = this.runtime } = {}) {
    return this._planFor.plan({
      model: this.model,
      runtime,
      runtimeCatalogEntry: this.catalogEntry,
      diagnostics,
      port: this.port,
      overrides,
      apiKey: this.launchKey,
      userArgs: this.userArgs,
    });
  }

  get runtimeServer() {
    return this.service.runtimeServer;
  }

  syncQueue(plan) {
    try { this.service.syncQueueConcurrency(plan && plan.maxConcurrent); } catch (_) {}
  }

  succeed(plan, extra = {}) {
    return { success: true, status: this.runtimeServer.getStatus(), plan, ...extra };
  }
}

module.exports = LaunchContext;
