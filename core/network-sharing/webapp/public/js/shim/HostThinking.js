export default class HostThinking {
  constructor(api) {
    this._api = api;
    this._cache = null;
  }

  async capability() {
    if (this._cache !== null) return this._cache;
    try {
      this._cache = (this._api.hostCapabilities ? await this._api.hostCapabilities() : null) || null;
    } catch (_) {
      this._cache = null;
    }
    return this._cache;
  }

  async defaults() {
    const caps = await this.capability();
    return caps ? { reasoningEffort: caps.hostDefault || 'default', noThink: false } : {};
  }

  async serverStatus() {
    const caps = await this.capability();
    return {
      state: caps ? 'ready' : 'idle',
      caps: caps ? { reasoningEffort: !!caps.available, reasoningDial: caps.positions || null } : null,
      plan: null,
    };
  }
}
