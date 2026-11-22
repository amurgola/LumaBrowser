class LlmDefaultsUpdater {
  static LAUNCH_SHAPE_KEYS = ['modelPath', 'runtimeId', 'maxConcurrent', 'tensorSplit', 'cacheReuse', 'usePeerGpus', 'contextSize', 'kvCacheType', 'openvinoDevice'];
  static ROUTER_KEYS = ['groupRouter', 'groupRouterPinRam'];

  constructor(llmServerService, log = console) {
    this._svc = llmServerService;
    this._log = log;
  }

  async update(payload) {
    const patch = payload || {};
    const before = this._svc.getDefaults();
    this._activateRuntime(patch);
    const defaults = await this._followDefaultModel(patch, this._svc.setDefaults(patch));
    const changed = (key) => patch[key] !== undefined && before[key] !== defaults[key];
    const serverStopped = this._launchShapeChanged(changed, patch, before, defaults) ? await this._stopServer() : false;
    this._reconcileRamPin(changed, defaults);
    this._reconcileRouter(changed);
    this._reconcileHelper(patch, before, defaults);
    return { defaults, serverStopped };
  }

  _activateRuntime(patch) {
    if (patch.runtimeId) this._svc.runtimeChooser.activate(patch.runtimeId);
  }

  async _followDefaultModel(patch, saved) {
    if (patch.modelPath === undefined && patch.runtimeId === undefined) return saved;
    try {
      await this._svc.runtimeFollower.follow();
    } catch (e) {
      this._log.warn('[llm-server] following the default model runtime failed:', e && e.message);
      return saved;
    }
    return this._svc.getDefaults();
  }

  _reconcileHelper(patch, before, defaults) {
    if (!patch.helperModel || !this._svc.helperModel || typeof this._svc.helperModel.apply !== 'function') return;
    if (JSON.stringify(before.helperModel || null) !== JSON.stringify(defaults.helperModel || null)) this._svc.helperModel.apply();
  }

  _launchShapeChanged(changed, patch, before, defaults) {
    if (LlmDefaultsUpdater.LAUNCH_SHAPE_KEYS.some(changed)) return true;
    if (before.runtimeId !== defaults.runtimeId) return true;
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
