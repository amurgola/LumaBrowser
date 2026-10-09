const ActionEvidenceScripts = require('./ActionEvidenceScripts');

class PageSettler {
  static DEFAULT_QUIET_MS = 400;
  static DEFAULT_MAX_SETTLE_MS = 3000;
  static POLL_MS = 100;
  static MIN_POLL_MS = 10;

  static SCRIPT_TIMEOUT_MS = 1500;

  static async runBounded(wc, script, timeoutMs = PageSettler.SCRIPT_TIMEOUT_MS) {
    let timer;
    try {
      return await Promise.race([
        Promise.resolve().then(() => wc.executeJavaScript(script, false)).catch(() => null),
        new Promise((resolve) => { timer = setTimeout(() => resolve(null), timeoutMs); }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  static async settle(wc, opts = {}) {
    const limits = PageSettler._resolveLimits(opts);
    const start = Date.now();
    if (opts.install) await PageSettler.runBounded(wc, ActionEvidenceScripts.installScript());
    let mutations = 0;
    for (;;) {
      if (PageSettler._isStopRequested(opts)) {
        return { settled: false, stopped: true, waitedMs: Date.now() - start, mutations, installed: true };
      }
      const poll = await PageSettler.runBounded(wc, ActionEvidenceScripts.pollScript());
      const waitedMs = Date.now() - start;
      if (!poll || !poll.installed) return { settled: false, waitedMs, mutations, installed: false };
      mutations = poll.mutations || 0;
      if (poll.age >= limits.quietMs) return { settled: true, waitedMs, mutations, installed: true };
      if (waitedMs >= limits.maxMs) return { settled: false, waitedMs, mutations, installed: true };
      await PageSettler._sleep(Math.min(limits.pollMs, Math.max(PageSettler.MIN_POLL_MS, limits.quietMs - poll.age)));
    }
  }

  static _resolveLimits(opts) {
    return {
      quietMs: Number.isFinite(opts.quietMs) ? Math.max(0, opts.quietMs) : PageSettler.DEFAULT_QUIET_MS,
      maxMs: Number.isFinite(opts.maxMs) ? Math.max(0, opts.maxMs) : PageSettler.DEFAULT_MAX_SETTLE_MS,
      pollMs: Number.isFinite(opts.pollMs) ? Math.max(PageSettler.MIN_POLL_MS, opts.pollMs) : PageSettler.POLL_MS,
    };
  }

  static _isStopRequested(opts) {
    return typeof opts.shouldStop === 'function' && !!opts.shouldStop();
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = PageSettler;
