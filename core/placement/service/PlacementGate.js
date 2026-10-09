const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const BestEffort = require('./BestEffort');

class PlacementGate {
  constructor({ servers, measuredStore, musicCatalog }) {
    this._servers = servers;
    this._measuredStore = measuredStore;
    this._musicCatalog = musicCatalog;
  }

  measuredCurrent() {
    const measured = this._measuredStore.all();
    const out = {};
    for (const item of PlacementLayout.ITEM_KEYS) {
      const key = this._servers.modelKey(item);
      out[item] = (key && measured[key]) || this.statedFootprint(item) || null;
    }
    return out;
  }

  canApply(layout) {
    try {
      const measured = this._measuredStore.all();
      return PlacementLayout.placedItems(layout).every((item) => this._isSized(item, measured));
    } catch (_) {
      return false;
    }
  }

  statedFootprint(itemKey) {
    if (itemKey === 'grounding') return this._groundingFootprint();
    if (itemKey === 'music') return BestEffort.read(() => this._musicFootprint());
    return null;
  }

  _isSized(item, measured) {
    const key = this._servers.modelKey(item);
    if (!key) return false;
    return !!measured[key] || !!this.statedFootprint(item);
  }

  _groundingFootprint() {
    const key = this._servers.modelKey('grounding');
    const bytes = BestEffort.read(() => this._servers.grounding.estimateVramBytes());
    if (!key || !(bytes > 0)) return null;
    return PlacementGate._footprint('grounding', key, bytes);
  }

  _musicFootprint() {
    const key = this._servers.modelKey('music');
    if (!key) return null;
    const row = this._musicCatalog.getById(key);
    const bytes = Number(row && row.minVramBytes);
    if (!Number.isFinite(bytes) || bytes <= 0) return null;
    return PlacementGate._footprint('music', key, bytes);
  }

  static _footprint(kind, modelKey, peakVramBytes) {
    return { kind, modelKey, peakVramBytes, peakRamBytes: null, vramApprox: true, fromCatalog: true, ranAt: null };
  }
}

module.exports = PlacementGate;
