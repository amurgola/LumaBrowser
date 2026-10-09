const CuratedModelCatalog = require('./CuratedModelCatalog');
const FitVramMath = require('./FitVramMath');
const HfGgufRepo = require('./HfGgufRepo');

class CatalogBuilder {
  static DEFAULT_QUANTS = ['Q4_K_M', 'Q6_K', 'Q8_0'];

  static CURATED_REPOS = CuratedModelCatalog.MODELS.map(({ id, repo, label, blurb, useCases }) => ({ id, repo, label, blurb, useCases }));

  constructor({ fetchVariants = (repoId, opts) => HfGgufRepo.fetchVariants(repoId, opts) } = {}) {
    this._fetchVariants = fetchVariants;
  }

  async build(repos = CatalogBuilder.CURATED_REPOS, { signal } = {}) {
    const results = await Promise.all(repos.map((spec) => this.buildEntry(spec, { signal })));
    const models = [];
    const errors = [];
    for (const result of results) {
      if (result._error) errors.push({ id: result.id, repo: result.repo, error: result._error });
      else models.push(result);
    }
    return { models, errors };
  }

  async buildEntry(spec, { signal } = {}) {
    let info;
    try {
      info = await this._fetchVariants(spec.repo, { signal });
    } catch (err) {
      return CatalogBuilder._failure(spec, err.message || String(err));
    }
    const variants = CatalogBuilder._variants(spec, info);
    if (!variants.length) return CatalogBuilder._failure(spec, 'No curated quants present in repo');
    return CatalogBuilder._entry(spec, info, variants);
  }

  static tierFor(paramsB) {
    const p = Number(paramsB) || 0;
    if (p < 6) return 'small';
    if (p < 12) return 'mid';
    if (p < 30) return 'large';
    return 'xl';
  }

  static minVramFor(approxBytes, paramsB) {
    return Math.round(approxBytes + FitVramMath.kvBytesAt8k(paramsB) + FitVramMath.GPU_OVERHEAD);
  }

  static labelFromRepo(repoId) {
    const name = String(repoId).split('/').pop() || repoId;
    return name.replace(/[-_]?GGUF$/i, '').replace(/[_]+/g, ' ').trim();
  }

  static _variants(spec, info) {
    const byQuant = new Map(info.variants.map((v) => [v.quant, v]));
    return (spec.quants || CatalogBuilder.DEFAULT_QUANTS)
      .filter((quant) => byQuant.has(quant))
      .map((quant) => {
        const v = byQuant.get(quant);
        return {
          quant,
          approxBytes: v.approxBytes,
          minVramBytes: CatalogBuilder.minVramFor(v.approxBytes, info.paramsB),
          file: v.file,
          url: v.url,
          sharded: v.sharded,
        };
      });
  }

  static _entry(spec, info, variants) {
    const paramsB = info.paramsB != null ? Math.round(info.paramsB * 10) / 10 : null;
    return {
      id: spec.id || info.repoId,
      label: spec.label || CatalogBuilder.labelFromRepo(spec.repo),
      blurb: spec.blurb || `${info.architecture || 'GGUF'} model · ${paramsB ? paramsB + 'B params' : 'local'}.`,
      repo: spec.repo,
      paramsB: paramsB || 0,
      maxContext: info.maxContext || 0,
      useCases: spec.useCases || ['chat', 'documents', 'development'],
      tier: spec.tier || CatalogBuilder.tierFor(paramsB),
      variants,
    };
  }

  static _failure(spec, message) {
    return { _error: message, id: spec.id, repo: spec.repo };
  }
}

module.exports = CatalogBuilder;
