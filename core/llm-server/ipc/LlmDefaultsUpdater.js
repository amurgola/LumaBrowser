class LlmDefaultsUpdater {
  static LAUNCH_SHAPE_KEYS = ['modelPath', 'runtimeId', 'maxConcurrent', 'tensorSplit', 'cacheReuse', 'usePeerGpus', 'contextSize', 'kvCacheType'];
  static ROUTER_KEYS = ['groupRouter', 'groupRouterPinRam'];

  constructor(llmServerService, log = console) {
    this._svc = llmServerService;
    this._log = log;
  }

  async update(payload) {
    const patch = payload || {};
    const before = this._svc.getDefaults();
    const defaults = this._svc.setDefaults(patch);
    const changed = (key) => patch[key] !== undefined && before[key] !== defaults[key];
    const serverStopped = this._launchShapeChanged(changed, patch, before, defaults) ? await this._stopServer() : false;
    this._reconcileRamPin(changed, defaults);
    this._reconcileRouter(changed);
    return { defaults, serverStopped };
  }

  _launchShapeChanged(changed, patch, before, defaults) {
    if (LlmDefaultsUpdater.LAUNCH_SHAPE_KEYS.some(changed)) return true;
    return patch.launchFlags !== undefined && String(before.launchFlags || '') !== String(defaults.launchFlags || '');
  }

  async _stopServer() {
    try {
      if (this._svc.runtimeServer.getStatus().state === 'idle') return false;
      await this._svc.runtimeServer.stop();
      return true;
    } catch (e) {
      this._log.warn('[llm-server] stop-on-model-change failed:', e && e.message);
      return false;
    }
  }

  _reconcileRamPin(changed, defaults) {
    if (changed('pinModelRam') || (changed('modelPath') && defaults.pinModelRam)) this._svc.ramPin.apply();
  }

  _reconcileRouter(changed) {
    if (LlmDefaultsUpdater.ROUTER_KEYS.some(changed)) this._svc.groupRouter.apply();
  }
}

module.exports = LlmDefaultsUpdater;
