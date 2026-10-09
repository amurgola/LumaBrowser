export default class CtxFitStore {
  constructor(api) {
    this._api = api;
    this._byPath = new Map();
  }

  async load() {
    this._byPath.clear();
    if (!this._api || !this._api.getLocalModelOptions) return;
    try {
      const r = await this._api.getLocalModelOptions();
      if (!r || !r.success) return;
      for (const m of (r.models || [])) if (m && m.path) this._byPath.set(m.path, m);
    } catch (_) {}
  }

  get(path) {
    return path ? this._byPath.get(path) || null : null;
  }

  forModel(model) {
    const path = model.weights && model.weights[0] && model.weights[0].path;
    return this.get(path);
  }

  summary(path) {
    const opts = this.get(path);
    const rungs = opts && opts.kvOptions && opts.kvOptions.f16;
    if (!rungs || rungs.length === 0) return '';
    let bestFull = null;
    let anyPartial = false;
    let anyKnown = false;
    for (const o of rungs) {
      if (o.state === 'unknown') continue;
      anyKnown = true;
      if (o.state === 'ok') bestFull = o.label;
      else if (o.state === 'partial') anyPartial = true;
    }
    if (!anyKnown) return '';
    if (bestFull) return `GPU ≤ ${bestFull}`;
    return anyPartial ? 'GPU partial' : 'CPU only';
  }
}
