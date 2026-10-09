const CURATED_MODELS = require('./CuratedModelCatalog.json');

class CuratedModelCatalog {
  static GB = 1024 * 1024 * 1024;

  static QUANT_ORDER = ['Q4_K_M', 'Q6_K', 'Q8_0'];

  static MODELS = CURATED_MODELS.map((row) => CuratedModelCatalog._toModel(row));

  static resolveUrl(model, quant) {
    const file = `${model.fileBase}-${quant}.gguf`;
    return {
      file,
      url: `https://huggingface.co/${model.repo}/resolve/main/${file}?download=true`,
    };
  }

  static listCatalog() {
    return CuratedModelCatalog.MODELS.map((model) => CuratedModelCatalog._toListRow(model));
  }

  static _toModel({ variantsGb, ...model }) {
    const variants = {};
    for (const [quant, sizes] of Object.entries(variantsGb)) {
      variants[quant] = {
        approxBytes: sizes.approxGb * CuratedModelCatalog.GB,
        minVramBytes: sizes.minVramGb * CuratedModelCatalog.GB,
      };
    }
    return { ...model, variants };
  }

  static _toListRow(model) {
    return {
      id: model.id,
      label: model.label,
      blurb: model.blurb,
      repo: model.repo,
      paramsB: model.paramsB,
      maxContext: model.maxContext,
      useCases: model.useCases,
      tier: model.tier,
      variants: CuratedModelCatalog._listVariants(model),
    };
  }

  static _listVariants(model) {
    return CuratedModelCatalog.QUANT_ORDER
      .filter((quant) => model.variants[quant])
      .map((quant) => ({
        quant,
        approxBytes: model.variants[quant].approxBytes,
        minVramBytes: model.variants[quant].minVramBytes,
        ...CuratedModelCatalog.resolveUrl(model, quant),
      }));
  }
}

module.exports = CuratedModelCatalog;
