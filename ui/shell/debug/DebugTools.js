export default class DebugTools {
  static TRACE_MS = 15000;

  constructor({ log }) {
    this._log = log;
  }

  dumpViewStack() {
    if (!window.viewDebugAPI || !window.viewDebugAPI.dump) return;
    window.viewDebugAPI.dump().then((d) => {
      console.log('[view-stack dump]', d);
      for (const [message, type] of DebugTools.dumpLines(d)) this._log.add(message, type);
    }).catch((err) => this._log.add(`View dump failed: ${err.message}`, 'error'));
  }

  static dumpLines(d) {
    const n = (d.views || []).length;
    const suspects = d.suspects || [];
    const where = d.file || 'console';
    const head = suspects.length
      ? [`View stack: ${n} views, ${suspects.length} SUSPECT(S). See ${where}`, 'error']
      : [`View stack: ${n} views, nothing suspicious. See ${where}`, 'info'];
    return [head, ...suspects.map((s) => [s, 'error'])];
  }

  startRuntimeTrace() {
    if (!window.viewDebugAPI || !window.viewDebugAPI.trace) return;
    this._log.add('Runtime trace: recording the UI thread for 15s. Drag the window around now.', 'info');
    window.viewDebugAPI.trace({ durationMs: DebugTools.TRACE_MS }).then((r) => {
      if (!r || !r.success) {
        this._log.add(`Runtime trace failed: ${(r && r.error) || 'unknown error'}`, 'error');
        return;
      }
      console.log('[runtime-trace]', r);
      this._log.add(`Runtime trace saved: ${r.dir}`, 'info');
      if (r.headline) this._log.add(r.headline, 'info');
      for (const n of (r.notes || [])) this._log.add(`Runtime trace note: ${n}`, 'error');
    }).catch((err) => this._log.add(`Runtime trace failed: ${err.message}`, 'error'));
  }
}
