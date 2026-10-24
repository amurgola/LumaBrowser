class HintContributions {
  constructor({ log = null } = {}) {
    this._providers = new Map();
    this._host = null;
    this._log = log || { warn: () => {} };
  }

  add(featureId, provider) {
    this._providers.set(featureId, provider);
    return () => { if (this._providers.get(featureId) === provider) this._providers.delete(featureId); };
  }

  entries(context = {}) {
    const out = [];
    for (const [featureId, provider] of this._providers) {
      let list = [];
      try { list = provider(context) || []; } catch (err) { this._log.warn(`hint entries from ${featureId} failed: ${(err && err.message) || err}`); }
      for (const e of list) {
        if (e && e.id && e.accelerator && typeof e.run === 'function') out.push({ ...e, featureId });
      }
    }
    return out;
  }

  setHost(host) {
    this._host = host;
    return () => { if (this._host === host) this._host = null; };
  }

  dismiss() {
    if (this._host) { try { this._host.dismiss(); } catch (_) {} }
  }

  target() {
    try { return (this._host && this._host.target()) || 0; } catch (_) { return 0; }
  }
}

module.exports = HintContributions;
