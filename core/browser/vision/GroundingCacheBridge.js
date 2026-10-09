class GroundingCacheBridge {
  static KIND = 'locate';

  constructor(resolutionCache, tabManager) {
    this._cache = resolutionCache || null;
    this._tabManager = tabManager;
  }

  async replay(tabId, description) {
    if (!this._cache) return null;
    try {
      return await this._cache.replay(this._tabManager, tabId, description, GroundingCacheBridge.KIND);
    } catch (err) {
      console.warn('[VisualGrounding] cache lookup failed:', err.message);
      return null;
    }
  }

  noteHit(hit) {
    this._cache.noteHit(hit.key);
  }

  noteFailedClick(hit, click) {
    this._cache.noteMiss(hit.key, { hard: true, reason: (click && click.error) || 'cached click failed' });
  }

  static dataFor(hit) {
    return { x: hit.x, y: hit.y, bbox: hit.bbox, target: hit.target || null, selector: hit.selector, resolvedBy: 'cache' };
  }

  async remember(tabId, description, x, y) {
    if (!this._cache) return;
    try {
      const captured = await this._cache.capture(this._tabManager, tabId, { point: { x, y } });
      if (captured) this._cache.remember(description, GroundingCacheBridge.KIND, captured, 'vision');
    } catch (err) {
      console.warn('[VisualGrounding] cache capture failed:', err.message);
    }
  }
}

module.exports = GroundingCacheBridge;
