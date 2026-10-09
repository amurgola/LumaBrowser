class SlotRequestRunner {
  static ABORTED = Object.freeze({ success: false, error: 'aborted' });

  constructor({ managedServers, resolveSlot }) {
    this._managed = managedServers;
    this._resolveSlot = resolveSlot;
  }

  static noProviderResult(slotId) {
    return { success: false, error: `No LLM provider configured for slot "${slotId}"` };
  }

  async run({ slotId, config, options, withVision = false, isAborted = () => false }, call) {
    const ready = await this._managed.ensureReady(config, { withVision });
    if (!ready.ok) return SlotRequestRunner._notReadyResult(ready);
    if (isAborted()) return { ...SlotRequestRunner.ABORTED };
    const { provider, modelOverride } = this._resolveSlot(slotId);
    if (!provider) return SlotRequestRunner.noProviderResult(slotId);
    if (modelOverride) options.model = modelOverride;
    return this._managed.track(config, () => call(provider));
  }

  static _notReadyResult(ready) {
    return {
      success: false,
      error: ready.error,
      code: ready.code,
      runtimeId: ready.runtimeId,
      runtimeName: ready.runtimeName,
      installable: ready.installable,
    };
  }
}

module.exports = SlotRequestRunner;
