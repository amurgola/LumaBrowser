const CivitaiAuth = require('../../shared/download/CivitaiAuth');
const PromiseTtlCache = require('../../shared/cache/PromiseTtlCache');
const CivitaiBaseMap = require('./CivitaiBaseMap');
const CivitaiClient = require('./CivitaiClient');
const CivitaiModelResolver = require('./CivitaiModelResolver');
const CivitaiSearchView = require('./CivitaiSearchView');

class CivitaiBrowser {
  static DEFAULT_LIMIT = 24;

  static DEFAULT_SORT = 'Most Downloaded';

  static DEFAULT_TYPES = Object.freeze(['Checkpoint']);

  static CACHE_TTL_MS = 5 * 60 * 1000;

  static BASE_FILTERS = Object.freeze([
    { id: 'importable', label: 'Installable bases', baseModels: null },
    { id: 'illustrious', label: 'Illustrious / NoobAI', baseModels: ['Illustrious', 'NoobAI'] },
    { id: 'pony', label: 'Pony', baseModels: ['Pony'] },
    { id: 'sdxl', label: 'SDXL', baseModels: ['SDXL 1.0', 'SDXL Lightning', 'SDXL Hyper', 'SDXL Turbo', 'SDXL 1.0 LCM', 'SDXL Distilled', 'SDXL 0.9'] },
    { id: 'sd15', label: 'SD 1.5', baseModels: ['SD 1.5', 'SD 1.5 LCM', 'SD 1.5 Hyper', 'SD 1.4'] },
    { id: 'flux', label: 'Flux / Chroma', baseModels: ['Flux.1 D', 'Flux.1 S', 'Flux.1 Krea', 'Flux.1 Kontext', 'Chroma'] },
    { id: 'qwen', label: 'Qwen-Image', baseModels: ['Qwen', 'Qwen 2.1'] },
    { id: 'anima', label: 'Anima', baseModels: ['Anima'] },
    { id: 'video', label: 'Video (browse only)', baseModels: ['Wan Video 2.2 T2V-A14B', 'Wan Video 2.2 I2V-A14B', 'Wan Video 2.2 TI2V-5B', 'Wan Video 14B t2v', 'Wan Video 14B i2v 480p', 'Wan Video 14B i2v 720p', 'LTXV', 'LTXV2', 'LTXV 2.3', 'LTXV 2.5', 'MiniMax H3'] },
    { id: 'any', label: 'Any base', baseModels: [] },
  ]);

  constructor({ client = new CivitaiClient(), imageServerService, now = Date.now }) {
    this._client = client;
    this._svc = imageServerService;
    this._pages = new PromiseTtlCache({ ttlMs: CivitaiBrowser.CACHE_TTL_MS, capacity: 40, now });
    this._details = new PromiseTtlCache({ ttlMs: CivitaiBrowser.CACHE_TTL_MS, capacity: 100, now });
  }

  static filters() {
    return {
      bases: CivitaiBrowser.BASE_FILTERS.map(({ id, label }) => ({ id, label })),
      sorts: [...CivitaiClient.SORTS],
      periods: [...CivitaiClient.PERIODS],
      types: [{ id: 'Checkpoint', label: 'Checkpoints' }, { id: 'LORA', label: 'LoRAs (browse only)' }],
    };
  }

  search(args = {}) {
    const filters = this._listFilters(args || {});
    return this._pages.get(JSON.stringify(filters), async () => ({ ...CivitaiSearchView.page(await this._client.listModels(filters)), filters: CivitaiBrowser.filters() }));
  }

  _listFilters(a) {
    const base = CivitaiBrowser.BASE_FILTERS.find((b) => b.id === a.base) || CivitaiBrowser.BASE_FILTERS[0];
    const baseModels = base.baseModels === null ? CivitaiBaseMap.importableBaseModels() : base.baseModels;
    return {
      query: a.query ? String(a.query).trim() : undefined,
      types: Array.isArray(a.types) && a.types.length ? a.types : [...CivitaiBrowser.DEFAULT_TYPES],
      baseModels: baseModels.length ? baseModels : undefined,
      sort: CivitaiClient.SORTS.includes(a.sort) ? a.sort : CivitaiBrowser.DEFAULT_SORT,
      period: CivitaiClient.PERIODS.includes(a.period) ? a.period : undefined,
      nsfw: a.nsfw === undefined ? this._nsfw() : !!a.nsfw,
      cursor: a.cursor || undefined,
      limit: a.limit || CivitaiBrowser.DEFAULT_LIMIT,
      primaryFileOnly: true,
    };
  }

  preview(args = {}) {
    const a = args || {};
    const ids = CivitaiModelResolver.ids(a);
    if (ids.error) return Promise.resolve({ success: false, error: ids.error });
    const key = JSON.stringify([ids.modelId, ids.versionId, a.fileId || null]);
    return this._details.get(key, () => this._previewFresh(ids, a.fileId));
  }

  async _previewFresh({ modelId, versionId }, fileId) {
    try {
      const id = modelId || (await this._client.getVersion(versionId)).modelId;
      const model = await this._client.getModel(id);
      const detail = CivitaiSearchView.detail(model, { versionId, fileId });
      if (!detail) return { success: false, error: `CivitAI model ${id} has no published versions.` };
      return { preview: detail };
    } catch (err) {
      return { success: false, error: `Could not read the CivitAI model: ${(err && err.message) || String(err)}` };
    }
  }

  getSettings() {
    const saved = this._settings();
    const env = !saved.token && CivitaiAuth.hasToken();
    return { hasToken: !!saved.token || env, tokenSource: saved.token ? 'settings' : (env ? 'env' : null), nsfw: saved.nsfw };
  }

  setSettings(patch = {}) {
    const saved = this._svc.setCivitaiSettings(patch || {});
    CivitaiAuth.setToken(saved.token);
    this._pages.clear();
    this._details.clear();
    return this.getSettings();
  }

  _settings() {
    return (this._svc && typeof this._svc.getCivitaiSettings === 'function') ? this._svc.getCivitaiSettings() : { token: null, nsfw: false };
  }

  _nsfw() {
    return !!this._settings().nsfw;
  }
}

module.exports = CivitaiBrowser;
