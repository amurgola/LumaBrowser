class ShutdownSequence {
  constructor(ctx, { log = console } = {}) {
    this._s = ctx.services;
    this._log = log;
  }

  async run() {
    this._log.log('Cleaning up before exit...');
    this._stopBackgroundWork();
    await this._s.extensionManager.deactivate();
    if (this._s.networkInterceptor) this._s.networkInterceptor.detachAll();
    await this._stopModelServers();
    await this._stopNetworkSurfaces();
  }

  _stopBackgroundWork() {
    const s = this._s;
    for (const stop of [
      () => s.artifactTaskScheduler.stop(),
      () => s.scheduledTaskScheduler.stop(),
      () => s.triggerRunner.stop(),
      () => s.fileWatchManager.stopAll(),
      () => s.pageChangeSource.stop(),
      () => s.notificationSource.stop(),
    ]) {
      try { stop(); } catch (_) {}
    }
  }

  async _stopModelServers() {
    const s = this._s;
    await this._warnOnFailure('llmServerService.shutdown', () => s.llmServerService.shutdown());
    await this._warnOnFailure('imageServerService.shutdown', () => s.imageServerService.shutdown());
    await ShutdownSequence._quietly(() => s.imageServerService.ramPin.stop());
    await this._warnOnFailure('musicServerService.shutdown', () => s.musicServerService.shutdown());
    await ShutdownSequence._quietly(() => s.whisperServerService.stop());
    await ShutdownSequence._quietly(() => s.ttsServerService.stop());
    await ShutdownSequence._quietly(() => s.groundingServerService.shutdown());
    await ShutdownSequence._quietly(() => global.__lumaDesktop && global.__lumaDesktop.shutdown());
  }

  async _stopNetworkSurfaces() {
    const s = this._s;
    await ShutdownSequence._quietly(() => s.sharingHostService.shutdown());
    await ShutdownSequence._quietly(() => s.sharingClientService.shutdown());
    await ShutdownSequence._quietly(() => s.localApiServer.stop());
    await s.restGateway.stop();
  }

  async _warnOnFailure(label, step) {
    try {
      await step();
    } catch (err) {
      this._log.warn(`${label} failed:`, err && err.message);
    }
  }

  static async _quietly(step) {
    try { await step(); } catch (_) {}
  }
}

module.exports = ShutdownSequence;
