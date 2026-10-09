const LaunchPlanner = require('./LaunchPlanner');
const MlxLaunchPlanner = require('./MlxLaunchPlanner');
const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');

class PlanFor {
  static MLX_LAUNCH_STYLE = 'mlx-server';

  static shared = new PlanFor();

  constructor({ catalog = LlmRuntimeCatalog.shared, launchPlanner = new LaunchPlanner(), mlxPlanner = new MlxLaunchPlanner() } = {}) {
    this._catalog = catalog;
    this._launchPlanner = launchPlanner;
    this._mlxPlanner = mlxPlanner;
  }

  plan(options) {
    const { runtimeCatalogEntry } = options;
    if (PlanFor.isMlx(runtimeCatalogEntry)) return this._planMlx(options);
    const hook = this._extensionPlanner(runtimeCatalogEntry);
    if (hook) return this._planWithHook(hook, options);
    return this._planLlama(options);
  }

  static isMlx(runtimeCatalogEntry) {
    return !!(runtimeCatalogEntry && runtimeCatalogEntry.launchStyle === PlanFor.MLX_LAUNCH_STYLE);
  }

  isCustomLaunch(runtimeCatalogEntry) {
    return PlanFor.isMlx(runtimeCatalogEntry) || !!this._extensionPlanner(runtimeCatalogEntry);
  }

  _planMlx({ model, runtime, port, overrides }) {
    const launch = this._mlxPlanner.plan({ model, runtime, port, overrides });
    launch.authKey = null;
    launch.cudaDevice = null;
    return launch;
  }

  _planWithHook(hook, { model, runtime, runtimeCatalogEntry, diagnostics, port, overrides, apiKey, userArgs }) {
    const launch = hook({ model, runtime, entry: runtimeCatalogEntry, diagnostics, port, overrides, apiKey, userArgs });
    PlanFor._assertValidLaunch(launch, runtimeCatalogEntry);
    if (launch.authKey === undefined) launch.authKey = null;
    if (launch.cudaDevice === undefined) launch.cudaDevice = null;
    return launch;
  }

  _planLlama({ model, runtime, diagnostics, port, overrides, apiKey, userArgs }) {
    return this._launchPlanner.plan({ model, runtime, diagnostics, port, overrides, apiKey, userArgs });
  }

  _extensionPlanner(runtimeCatalogEntry) {
    if (!runtimeCatalogEntry || runtimeCatalogEntry.acquisition !== 'extension') return null;
    let hooks = null;
    try { hooks = this._catalog.getExtensionHooks(runtimeCatalogEntry.id); } catch (_) { hooks = null; }
    return hooks && typeof hooks.planLaunch === 'function' ? hooks.planLaunch : null;
  }

  static _assertValidLaunch(launch, entry) {
    if (!launch || !launch.binaryPath || !Array.isArray(launch.args) || !launch.plan) {
      throw new Error(`${entry.name || entry.id}: planLaunch returned an invalid launch`);
    }
  }
}

module.exports = PlanFor;
