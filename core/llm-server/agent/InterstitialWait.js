function interstitialProbe() {
  const meta = document.querySelector('meta[http-equiv="refresh" i]');
  const text = (document.body && document.body.innerText) || '';
  return { url: location.href, refresh: meta ? meta.getAttribute('content') : null, text: text.slice(0, 2000), chars: text.length, ready: document.readyState };
}

class InterstitialWait {
  static PROBE_SCRIPT = `(${interstitialProbe.toString()})()`;

  static MAX_WAIT_MS = 20000;
  static POLL_MS = 500;
  static MAX_TEXT_CHARS = 1500;
  static CUES = new RegExp([
    'please wait', 'wait (?:a|one) (?:moment|second|few seconds)', 'one moment', 'just a moment',
    'redirecting', 'you(?:\'ll| will) be (?:redirected|forwarded|taken)', 'forwarding you', 'taking you to',
    'checking (?:your browser|if the site connection is secure)',
    'verifying (?:that )?(?:you are|you\'re) (?:a )?human', 'security check',
  ].map((cue) => `\\b${cue}\\b`).join('|'), 'i');

  static STILL_WAITING_NOTE = 'This page says it will continue by itself (a wait, redirect or verification page) '
    + 'and had not moved on after waiting. Do NOT navigate to it again: that restarts the wait. Call observe_page '
    + 'again in a little while, or ask the user if it needs them.';

  constructor({ browserService, sleep, now = () => Date.now() }) {
    this._browser = browserService;
    this._sleep = sleep;
    this._now = now;
  }

  async settle(tabId) {
    const start = await this._probe(tabId);
    if (!InterstitialWait.isInterstitial(start)) return null;
    const began = this._now();
    while (this._now() - began < InterstitialWait.MAX_WAIT_MS) {
      await this._sleep(InterstitialWait.POLL_MS);
      const p = await this._probe(tabId);
      if (p && p.ready === 'complete' && !InterstitialWait.isInterstitial(p)) {
        return { moved: true, from: start.url, to: p.url, waitedMs: this._now() - began };
      }
    }
    return { moved: false, from: start.url, to: start.url, waitedMs: this._now() - began };
  }

  static isInterstitial(p) {
    if (!p) return false;
    if (p.refresh) return true;
    return p.chars <= InterstitialWait.MAX_TEXT_CHARS && InterstitialWait.CUES.test(p.text || '');
  }

  async _probe(tabId) {
    try {
      const res = await this._browser.executeJs(tabId, InterstitialWait.PROBE_SCRIPT);
      const value = res && res.data ? res.data.result : null;
      return value && typeof value.url === 'string' ? value : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = InterstitialWait;
