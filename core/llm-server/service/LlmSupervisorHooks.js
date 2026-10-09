class LlmSupervisorHooks {
  static SERVER_ID = 'llm';
  static WATCHDOG_STOP_STATES = Object.freeze(['idle', 'error', 'stopping']);
  static RELEASE_PEER_STATES = Object.freeze(['idle', 'error']);

  static wire({ runtimeServer, vramCoordinator, releasePeers, vramWatchdog, runningCaps }) {
    vramCoordinator.releaseOnIdle(runtimeServer, LlmSupervisorHooks.SERVER_ID);
    vramCoordinator.markResidentOnReady(runtimeServer, LlmSupervisorHooks.SERVER_ID);
    runtimeServer.on('state-change', (e) => LlmSupervisorHooks._releasePeers(e, releasePeers));
    runtimeServer.on('state-change', (e) => LlmSupervisorHooks._followWithWatchdog(e, vramWatchdog));
    runtimeServer.on('state-change', (e) => LlmSupervisorHooks._rememberCaps(e, runningCaps));
  }

  static _releasePeers(e, releasePeers) {
    if (!e || !LlmSupervisorHooks.RELEASE_PEER_STATES.includes(e.state)) return;
    Promise.resolve().then(releasePeers).catch(() => {});
  }

  static _followWithWatchdog(e, vramWatchdog) {
    if (!e) return;
    if (e.state === 'ready') vramWatchdog.start();
    else if (LlmSupervisorHooks.WATCHDOG_STOP_STATES.includes(e.state)) vramWatchdog.stop();
  }

  static _rememberCaps(e, runningCaps) {
    if (e && e.state === 'ready') runningCaps.rememberRunning();
  }
}

module.exports = LlmSupervisorHooks;
