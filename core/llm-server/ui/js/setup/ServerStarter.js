export default class ServerStarter {
  static ALREADY_RUNNING_RE = /cannot start: server is (ready|starting)/i;

  static async startIdempotent(api) {
    const started = await api.startServer();
    if (started && started.success !== false) return { ok: true };
    const error = (started && started.error) || 'Server failed to start';
    if (!ServerStarter.ALREADY_RUNNING_RE.test(error)) return { ok: false, message: error };
    await ServerStarter._tryRestart(api);
    return { ok: true, alreadyRunning: true };
  }

  static async _tryRestart(api) {
    if (typeof api.restartServer !== 'function') return;
    try { await api.restartServer(); } catch (_) {}
  }
}
