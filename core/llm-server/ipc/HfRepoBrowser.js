const HfModelSearch = require('../models/HfModelSearch');
const HfModelFilter = require('../models/HfModelFilter');
const HfGgufRepo = require('../models/HfGgufRepo');
const HfMlxRepo = require('../models/HfMlxRepo');
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

  constructor({
    wizard, search = HfModelSearch, gguf = HfGgufRepo, mlx = HfMlxRepo, readme = HfReadme, filter = HfModelFilter,
    liveCatalog = LiveCatalog.shared, curated = CuratedModelCatalog.MODELS, now = Date.now,
  }) {
    this._wizard = wizard;
    this._search = search;
    this._gguf = gguf;
    this._mlx = mlx;
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
    const key = JSON.stringify([a.query || '', a.sort || '', a.limit || 0, !!a.mlx, !!a.fit]);
    return this._searches.get(key, () => this._searchFresh(a));
  }

  async _searchFresh(a) {
    const limit = Number(a.limit) > 0 ? Number(a.limit) : undefined;
    if (a.mlx) {
      const rows = await this._search.search({ query: a.query, sort: a.sort, limit, mlx: true });
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
    const mlx = !!(opts && opts.mlx);
    return this._repos.get(`${mlx ? 'mlx' : 'gguf'}:${repoId}`, () => this._expandFresh(repoId, mlx));
  }

  async _expandFresh(repoId, mlx) {
    try {
      const hardware = await this.hardware();
      const info = mlx ? await this._mlxInfo(repoId, hardware) : await this._ggufInfo(repoId, hardware);
      return { info, hardware };
    } catch (err) {
      throw IpcFailure.withCode(err);
    }
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
