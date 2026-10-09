export default class ShimModels {
  static PROBE_MS = 15000;

  constructor({ api, serverEvents, win, doc }) {
    this._api = api;
    this._serverEvents = serverEvents;
    this._win = win;
    this._doc = doc;
    this._healthy = null;
  }

  async list() {
    try {
      const models = await this._api.listModels();
      return { success: true, models: models.map(ShimModels.toDesktop), defaultRef: models[0] ? models[0].id : null };
    } catch (e) {
      if (e && e.unauthorized) throw e;
      return { success: false, models: [], error: e && e.message };
    }
  }

  startProbing() {
    this._win.addEventListener('online', () => this.probe());
    this._doc.addEventListener('visibilitychange', () => { if (!this._doc.hidden) this.probe(); });
    return this._win.setInterval(() => { if (!this._doc.hidden) this.probe(); }, ShimModels.PROBE_MS);
  }

  async probe() {
    let ok = false;
    try {
      ok = (await this._api.listModels()).length > 0;
    } catch (_) {
      ok = false;
    }
    if (ok && this._healthy !== true) this._serverEvents.emit({ type: 'providers-changed' });
    this._healthy = ok;
  }

  static toDesktop(m) {
    return {
      ref: m.id,
      label: m.label,
      providerId: m.id.split('::')[0] || '',
      providerType: m.kind === 'local' ? 'local' : 'openai',
      isLocal: m.kind === 'local',
      ready: true,
    };
  }
}
