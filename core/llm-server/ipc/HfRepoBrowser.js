const HfModelSearch = require('../models/HfModelSearch');
const HfGgufRepo = require('../models/HfGgufRepo');
const HfMlxRepo = require('../models/HfMlxRepo');
const HfReadme = require('../models/HfReadme');
const LiveCatalog = require('../models/LiveCatalog');
const CuratedModelCatalog = require('../models/CuratedModelCatalog');
const FitClassifier = require('../models/FitClassifier');
const MlxFitClassifier = require('../models/MlxFitClassifier');
const HfModelInput = require('./HfModelInput');
const IpcFailure = require('./IpcFailure');

class HfRepoBrowser {
  constructor({
    wizard, search = HfModelSearch, gguf = HfGgufRepo, mlx = HfMlxRepo, readme = HfReadme,
    liveCatalog = LiveCatalog.shared, curated = CuratedModelCatalog.MODELS,
  }) {
    this._wizard = wizard;
    this._search = search;
    this._gguf = gguf;
    this._mlx = mlx;
    this._readme = readme;
    this._liveCatalog = liveCatalog;
    this._curated = curated;
  }

  async search(args) {
    const a = args || {};
    return { results: await this._search.search({ query: a.query, sort: a.sort, limit: a.limit, mlx: !!a.mlx }) };
  }

  async catalogLive(opts) {
    const { models, source, errors } = await this._liveCatalog.get({ force: !!(opts && opts.force) });
    return { models, source, errors };
  }

  async expand(repoId, opts) {
    try {
      const hardware = await this._wizard.hardware().catch(() => null);
      const info = opts && opts.mlx ? await this._mlxInfo(repoId, hardware) : await this._ggufInfo(repoId, hardware);
      return { info, hardware };
    } catch (err) {
      throw IpcFailure.withCode(err);
    }
  }

  async readme(repoId) {
    try {
      return { readme: await this._readme.fetch(repoId) };
    } catch (err) {
      throw IpcFailure.withCode(err);
    }
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
