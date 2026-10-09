import PlacementItems from './PlacementItems.js';
import RemoteRefs from './RemoteRefs.js';

export default class PlacementFit {
  constructor(model) {
    this._model = model;
  }

  itemBytes(itemKey) {
    const m = this._model.measured && this._model.measured[itemKey];
    if (!m) return null;
    const ctx = this._model.context();
    if (itemKey === 'llm' && ctx && ctx.enabled && ctx.location === 'ram' && m.weightsBytes != null) return m.weightsBytes;
    return m.peakVramBytes != null ? m.peakVramBytes : null;
  }

  singularityMax(singularity) {
    let max = null;
    let anyMissing = false;
    for (const key of singularity.members) {
      if (!PlacementItems.meta(key)) continue;
      const b = this.itemBytes(key);
      if (b == null) anyMissing = true; else max = Math.max(max || 0, b);
    }
    return { bytes: max, anyMissing };
  }

  lanePlanned(resId) {
    const standalone = this._standalonePlanned(resId);
    let { bytes } = standalone;
    let { anyMissing } = standalone;
    for (const s of this._model.layout.singularities) {
      if (s.resource !== resId) continue;
      const mm = this.singularityMax(s);
      if (mm.anyMissing) anyMissing = true;
      if (mm.bytes != null) bytes += mm.bytes;
    }
    return { bytes, anyMissing };
  }

  capacity(resource) {
    if (!resource || resource.kind === 'ram') return null;
    let cap = 0;
    for (const idx of resource.devices) cap += this._deviceBytes(idx);
    return cap || null;
  }

  _standalonePlanned(resId) {
    let bytes = 0;
    let anyMissing = false;
    for (const it of PlacementItems.ITEMS) {
      const entry = this._model.layout.items[it.key];
      if (this._model.singularityFor(it.key)) continue;
      if (!entry || entry.resource !== resId) continue;
      const b = this.itemBytes(it.key);
      if (b == null) anyMissing = true; else bytes += b;
    }
    return { bytes, anyMissing };
  }

  _deviceBytes(idx) {
    if (RemoteRefs.isRemote(idx)) {
      const rd = RemoteRefs.find(this._model.snapshot, idx);
      return rd ? (rd.totalBytes || 0) : 0;
    }
    const d = this._model.device(idx);
    return d ? (d.totalBytes || 0) : 0;
  }
}
