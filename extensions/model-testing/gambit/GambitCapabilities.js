const https = require('https');

class GambitCapabilities {
  static WEB_TARGET = 'https://lumabyte.com/automation-test';
  static PROBE_TIMEOUT_MS = 8000;

  static async detect({ checkWeb = true, probe = GambitCapabilities.probeWeb, imageRouter = global.__lumaImageRouter } = {}) {
    const caps = { web: true };
    const reasons = {};
    if (checkWeb) await GambitCapabilities._detectWeb(probe, caps, reasons);
    caps.images = !!imageRouter;
    if (!caps.images) reasons.images = 'no image server on this build';
    return { caps, reasons };
  }

  static probeWeb(url = GambitCapabilities.WEB_TARGET, timeoutMs = GambitCapabilities.PROBE_TIMEOUT_MS, client = https) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (ok, detail) => {
        if (settled) return;
        settled = true;
        resolve({ ok, detail });
      };
      try {
        const req = client.get(url, { timeout: timeoutMs }, (res) => {
          res.resume();
          done(res.statusCode >= 200 && res.statusCode < 400, `HTTP ${res.statusCode}`);
        });
        req.on('timeout', () => { req.destroy(); done(false, `no response in ${timeoutMs}ms`); });
        req.on('error', (err) => done(false, err.message));
      } catch (err) {
        done(false, err.message);
      }
    });
  }

  static async _detectWeb(probe, caps, reasons) {
    const result = await probe();
    caps.web = result.ok;
    if (!result.ok) reasons.web = `automation-test page unreachable (${result.detail})`;
  }
}

module.exports = GambitCapabilities;
