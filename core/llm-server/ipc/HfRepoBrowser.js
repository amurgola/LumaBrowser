const HfModelSearch = require('../models/HfModelSearch');
const HfModelFilter = require('../models/HfModelFilter');
const HfGgufRepo = require('../models/HfGgufRepo');
const HfMlxRepo = require('../models/HfMlxRepo');
const HfPackRepo = require('../models/HfPackRepo');
const HfReadme = require('../models/HfReadme');
const LiveCatalog = require('../models/LiveCatalog');
const CuratedModelCatalog = require('../models/CuratedModelCatalog');
const FitClassifier = require('../models/FitClassifier');
const MlxFitClassifier = require('../models/MlxFitClassifier');
const PromiseTtlCache = require('../../shared/cache/PromiseTtlCache');
const HfModelInput = require('./HfModelInput');
const IpcFailure = require('./IpcFailure');

class HfRepoBrowser {
  static HARDWARE_TTL_MS = 60 * 1000;

  static SEARCH_TTL_MS = 5 * 60 * 1000;

  static REPO_TTL_MS = 10 * 60 * 1000;

  static OVERFETCH = 2;

  static GGUF = 'gguf';
  static MLX = 'mlx';
  static UNKNOWN_FORMAT = 'No installed framework finds that kind of model on Hugging Face.';

  constructor({
    wizard, hubSource = async () => null, search = HfModelSearch, gguf = HfGgufRepo, mlx = HfMlxRepo, pack = HfPackRepo,
    readme = HfReadme, filter = HfModelFilter, liveCatalog = LiveCatalog.shared, curated = CuratedModelCatalog.MODELS, now = Date.now,
  }) {
    this._wizard = wizard;
    this._hubSource = hubSource;
    this._search = search;
    this._gguf = gguf;
    this._mlx = mlx;
    this._pack = pack;
    this._readme = readme;
    this._filter = filter;
    this._liveCatalog = liveCatalog;
    this._curated = curated;
    this._hardwareCache = new PromiseTtlCache({ ttlMs: HfRepoBrowser.HARDWARE_TTL_MS, capacity: 1, now });
    this._searches = new PromiseTtlCache({ ttlMs: HfRepoBrowser.SEARCH_TTL_MS, capacity: 40, now });
    this._repos = new PromiseTtlCache({ ttlMs: HfRepoBrowser.REPO_TTL_MS, capacity: 100, now });
    this._readmes = new PromiseTtlCache({ ttlMs: HfRepoBrowser.REPO_TTL_MS, capacity: 100, now });
  }

  search(args) {
    const a = args || {};
    const format = HfRepoBrowser.formatOf(a);
    const key = JSON.stringify([a.query || '', a.sort || '', a.limit || 0, format, !!a.fit]);
    return this._searches.get(key, () => this._searchFresh(a, format));
  }

  static formatOf(opts) {
    const o = opts || {};
    if (typeof o.format === 'string' && o.format) return o.format;
    return o.mlx ? HfRepoBrowser.MLX : HfRepoBrowser.GGUF;
  }

  async _searchFresh(a, format) {
    const limit = Number(a.limit) > 0 ? Number(a.limit) : undefined;
    if (format !== HfRepoBrowser.GGUF) {
      const mode = format === HfRepoBrowser.MLX ? { mlx: true } : { mlx: false, tag: (await this._requireSource(format)).tag };
      const rows = await this._search.search({ query: a.query, sort: a.sort, limit, ...mode });
      return { results: rows, hidden: { ...HfModelFilter.HIDDEN_NONE } };
    }
    const fetchLimit = limit ? Math.min(HfModelSearch.MAX_LIMIT, limit * HfRepoBrowser.OVERFETCH) : undefined;
    const [rows, hardware] = await Promise.all([
      this._search.search({ query: a.query, sort: a.sort, limit: fetchLimit, mlx: false }),
      this.hardware(),
    ]);
    const { results, hidden } = this._filter.apply(rows, { hardware, fit: !!a.fit });
    return { results: limit ? results.slice(0, limit) : results, hidden };
  }

  async catalogLive(opts) {
    const { models, source, errors } = await this._liveCatalog.get({ force: !!(opts && opts.force) });
    return { models, source, errors };
  }

  hardware() {
    return this._hardwareCache.get('hw', () => this._wizard.hardware().catch(() => null));
  }

  expand(repoId, opts) {
    const format = HfRepoBrowser.formatOf(opts);
    return this._repos.get(`${format}:${repoId}`, () => this._expandFresh(repoId, format));
  }

  async _expandFresh(repoId, format) {
    try {
      const hardware = await this.hardware();
      return { info: await this._infoOf(repoId, format, hardware), hardware };
    } catch (err) {
      throw IpcFailure.withCode(err);
    }
  }

  _infoOf(repoId, format, hardware) {
    if (format === HfRepoBrowser.MLX) return this._mlxInfo(repoId, hardware);
    if (format === HfRepoBrowser.GGUF) return this._ggufInfo(repoId, hardware);
    return this._packInfo(repoId, format);
  }

  async _packInfo(repoId, format) {
    const source = await this._requireSource(format);
    const info = await this._pack.fetchInfo(repoId, { extension: source.extension });
    return { ...info, format, extension: source.extension, variants: info.variants.map((variant) => ({ ...variant, fit: null })) };
  }

  async _requireSource(format) {
    const source = await this._hubSource(format);
    if (!source) throw new Error(HfRepoBrowser.UNKNOWN_FORMAT);
    return source;
  }

  readme(repoId) {
    return this._readmes.get(String(repoId), async () => {
      try {
        return { readme: await this._readme.fetch(repoId) };
      } catch (err) {
        throw IpcFailure.withCode(err);
      }
    });
  }

  async _mlxInfo(repoId, hardware) {
    const info = await this._mlx.fetchInfo(repoId);
    const approxBytes = info.weightsBytes || info.totalBytes || 0;
    const variant = {
      quant: info.quantization || 'MLX',
      file: HfModelInput.repoDirName(info.repoId),
      approxBytes,
      sharded: false,
      mlx: true,
      repoId: info.repoId,
      fit: hardware ? MlxFitClassifier.classify(approxBytes, hardware) : null,
    };
    return {
      repoId: info.repoId, author: info.author, name: info.name, gated: info.gated,
      paramsB: info.paramsB, maxContext: info.maxContext, architecture: info.architecture,
      mlx: true, variants: [variant],
    };
  }

  async _ggufInfo(repoId, hardware) {
    const info = await this._gguf.fetchVariants(repoId);
    const activeParamsB = this._curatedActiveParams(repoId);
    const variants = info.variants.map((v) => ({
      ...v,
      fit: hardware ? FitClassifier.classify({ approxBytes: v.approxBytes, paramsB: info.paramsB, activeParamsB, maxContext: info.maxContext }, hardware) : null,
    }));
    return { ...info, variants };
  }

  _curatedActiveParams(repoId) {
    const want = String(repoId).toLowerCase();
    const curated = (this._curated || []).find((m) => m && m.repo && String(m.repo).toLowerCase() === want);
    return curated && curated.moe && Number(curated.moe.activeParamsB) > 0 ? curated.moe.activeParamsB : undefined;
  }
}

module.exports = HfRepoBrowser;
