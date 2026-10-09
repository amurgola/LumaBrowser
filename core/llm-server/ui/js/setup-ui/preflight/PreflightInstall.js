import PreflightProgress from './PreflightProgress.js';

export default class PreflightInstall {
  constructor(api) {
    this._api = api;
  }

  async run(issue, row, btn) {
    const fix = issue.fix;
    const surface = this._surfaceFor(fix.server);
    if (!surface || !surface.installRuntime) return false;
    btn.disabled = true;
    PreflightProgress.set(row, { phase: 'Starting…', indeterminate: true });
    const unsubscribe = this._followEvents(surface, fix.runtimeId, row);
    const res = await this._install(surface, fix.runtimeId);
    if (unsubscribe) { try { unsubscribe(); } catch (_) {} }
    if (res && res.success) return true;
    PreflightProgress.set(row, { phase: `Failed: ${(res && res.error) || 'unknown error'}`, indeterminate: false, received: 0, total: 0 });
    btn.disabled = false;
    return false;
  }

  _surfaceFor(server) {
    if (server === 'image') return this._api.image;
    if (server === 'music') return this._api.music;
    return this._api;
  }

  async _install(surface, runtimeId) {
    try { return await surface.installRuntime(runtimeId); } catch (err) {
      return { success: false, error: err && err.message };
    }
  }

  _followEvents(surface, runtimeId, row) {
    if (!surface.onRuntimeEvent) return null;
    return surface.onRuntimeEvent(({ id, type, payload }) => {
      if (id !== runtimeId) return;
      const progress = PreflightInstall.progressFor(type, payload);
      if (progress) PreflightProgress.set(row, progress);
    });
  }

  static progressFor(type, payload) {
    if (type === 'start') return { phase: 'Resolving release…', indeterminate: true };
    if (type === 'resolved') {
      const asset = payload && payload.asset;
      return { phase: `Downloading ${asset ? asset.name : ''}`, indeterminate: true };
    }
    if (type === 'download') {
      return {
        phase: 'Downloading',
        received: payload && payload.received,
        total: payload && payload.total,
        indeterminate: !(payload && payload.total > 0),
      };
    }
    if (type === 'extract') return { phase: 'Extracting…', indeterminate: true };
    if (type === 'finalize') return { phase: 'Finishing…', indeterminate: true };
    return null;
  }
}
