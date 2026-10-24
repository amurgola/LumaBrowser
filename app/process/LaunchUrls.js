class LaunchUrls {
  static MAX_PER_LAUNCH = 10;
  static MAX_LENGTH = 8192;

  static fromArgv(argv) {
    const out = [];
    for (const arg of Array.isArray(argv) ? argv : []) {
      const url = LaunchUrls._webUrl(arg);
      if (url && !out.includes(url)) out.push(url);
      if (out.length >= LaunchUrls.MAX_PER_LAUNCH) break;
    }
    return out;
  }

  constructor({ getTabViewManager, log = console, defer = setImmediate }) {
    this._tvm = getTabViewManager;
    this._log = log;
    this._defer = defer;
    this._pending = [];
    this._ready = false;
  }

  open(urls) {
    const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
    if (!list.length) return 0;
    if (!this._ready) {
      this._pending.push(...list);
      return 0;
    }
    return this._openNow(list);
  }

  ready() {
    this._ready = true;
    if (!this._pending.length) return;
    this._defer(() => {
      const queued = this._pending.splice(0);
      this._openNow(queued);
    });
  }

  get pending() {
    return this._pending.slice();
  }

  _openNow(urls) {
    const tvm = this._tvm();
    if (!tvm) {
      this._pending.push(...urls);
      this._ready = false;
      return 0;
    }
    let opened = 0;
    for (const url of urls) {
      try {
        tvm.createTab(url, { kind: 'user' });
        opened++;
      } catch (err) {
        this._log.warn('[launch-urls] could not open', url, err && err.message);
      }
    }
    return opened;
  }

  static _webUrl(arg) {
    const text = typeof arg === 'string' ? arg.trim() : '';
    if (!text || text.length > LaunchUrls.MAX_LENGTH || !/^https?:\/\//i.test(text)) return null;
    try {
      const url = new URL(text);
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname ? url.href : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = LaunchUrls;
