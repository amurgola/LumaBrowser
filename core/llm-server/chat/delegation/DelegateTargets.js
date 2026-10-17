class DelegateTargets {
  constructor({ registry }) {
    this._registry = registry;
  }

  list() {
    const out = [];
    const seen = new Set();
    for (const mode of this._delegatingModes()) {
      for (const t of DelegateTargets._targetsOf(mode.delegate)) {
        if (!t || !t.id || seen.has(String(t.id))) continue;
        seen.add(String(t.id));
        out.push({
          id: String(t.id),
          modeId: mode.id,
          label: t.label || mode.label || mode.id,
          description: t.description || '',
          params: t.params && typeof t.params === 'object' ? t.params : {},
        });
      }
    }
    return out;
  }

  find(idOrLabel) {
    const key = String(idOrLabel || '').trim();
    if (!key) return null;
    const all = this.list();
    const lower = key.toLowerCase();
    return all.find((t) => t.id === key) || all.find((t) => t.label.toLowerCase() === lower) || null;
  }

  start(target, args) {
    const mode = this._registry.get(target.modeId);
    const spec = mode && mode.delegate;
    if (!spec || typeof spec.start !== 'function') return { error: `"${target.id}" can no longer be delegated to.` };
    try {
      const res = spec.start({ targetId: target.id, args: args || {} }) || {};
      if (res.error) return { error: String(res.error) };
      if (!res.message || !String(res.message).trim()) return { error: `"${target.id}" did not produce a first message.` };
      return { data: res.data && typeof res.data === 'object' ? res.data : {}, message: String(res.message), title: res.title || null };
    } catch (err) {
      return { error: `Could not start "${target.id}": ${(err && err.message) || err}` };
    }
  }

  _delegatingModes() {
    const out = [];
    for (const listed of this._registry.list()) {
      const mode = this._registry.get(listed.id);
      if (mode && mode.delegate && typeof mode.delegate.start === 'function') out.push(mode);
    }
    return out;
  }

  static _targetsOf(spec) {
    try {
      const targets = typeof spec.targets === 'function' ? spec.targets() : spec.targets;
      return Array.isArray(targets) ? targets : [];
    } catch (_) {
      return [];
    }
  }
}

module.exports = DelegateTargets;
