const ResolutionCacheStore = require('./resolution-cache/ResolutionCacheStore');
const ResolutionCacheSnapshot = require('./resolution-cache/ResolutionCacheSnapshot');
const ResolutionCacheKey = require('./resolution-cache/ResolutionCacheKey');
const TabPageAccess = require('./resolution-cache/TabPageAccess');
const ResolutionCachePage = require('./ResolutionCachePage');

class ResolutionCache extends ResolutionCacheStore {
  static STORAGE_KEY = ResolutionCacheSnapshot.STORAGE_KEY;
  static ENABLED_SETTING = 'core.browser.resolutionCache.enabled';

  isEnabled() {
    if (!this.store || typeof this.store.get !== 'function') return true;
    try { return this.store.get(ResolutionCache.ENABLED_SETTING, true) !== false; } catch { return true; }
  }

  async replay(tabManager, tabId, description, kind, { pointCheck = true, requireExact = false } = {}) {
    if (!this.isEnabled()) return null;
    const key = ResolutionCacheKey.of(await TabPageAccess.urlOf(tabManager, tabId), description, kind);
    const entry = key ? this.get(key) : null;
    if (!entry) return null;
    const check = await TabPageAccess.run(tabManager, tabId, ResolutionCache._validation(entry, pointCheck));
    if (!this._passes(key, check, requireExact)) return null;
    return this._serve(key, entry, check);
  }

  async capture(tabManager, tabId, at) {
    if (!this.isEnabled() || !at) return null;
    const script = ResolutionCache._captureScript(at);
    if (!script) return null;
    const captured = await TabPageAccess.run(tabManager, tabId, script);
    return captured && captured.selector ? captured : null;
  }

  remember(description, kind, captured, source) {
    if (!captured) return null;
    const key = ResolutionCacheKey.of(captured.href, description, kind);
    if (!key) return null;
    return this.put(key, { ...captured, source });
  }

  static _validation(entry, pointCheck) {
    return ResolutionCachePage.validateScript(entry.selector, { tag: entry.tag, text: entry.textHint }, { pointCheck });
  }

  static _captureScript(at) {
    if (at.point) return ResolutionCachePage.captureAtPointScript(at.point.x, at.point.y);
    return at.selector ? ResolutionCachePage.captureForSelectorScript(at.selector) : null;
  }

  _passes(key, check, requireExact) {
    if (!check) {
      this._log(`skip  validation-unavailable  key=${key}`);
      return false;
    }
    if (!check.ok) {
      this.noteMiss(key, { hard: check.hard !== false, reason: check.reason });
      return false;
    }
    if (requireExact && !check.exact) {
      this.noteMiss(key, { hard: true, reason: 'first match is not the validated element' });
      return false;
    }
    return true;
  }

  _serve(key, entry, check) {
    this._counters.served++;
    this._log(`hit  key=${key}  selector=${JSON.stringify(entry.selector)}  source=${entry.source}`);
    return { key, entry, selector: entry.selector, exact: !!check.exact, x: check.x, y: check.y, bbox: check.bbox, target: check.target };
  }
}

module.exports = ResolutionCache;
