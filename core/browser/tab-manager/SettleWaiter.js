const ActionEvidenceScripts = require('../ActionEvidenceScripts');
const PageSettler = require('../PageSettler');

class SettleWaiter {
  static async wait(page, options = {}) {
    const wc = page.webContents;
    const r = await PageSettler.settle(wc, { install: true, quietMs: Number(options.quietMs), maxMs: Number(options.maxMs) });
    await PageSettler.runBounded(wc, ActionEvidenceScripts.finalScript({ fingerprint: false }));
    return { success: true, data: { settled: r.settled, waitedMs: r.waitedMs, mutations: r.mutations } };
  }
}

module.exports = SettleWaiter;
