const CuratedModelCatalog = require('./CuratedModelCatalog');
const ModelNameToken = require('./ModelNameToken');

class ModelName {
  static key(filePath) {
    const base = String(filePath == null ? '' : filePath).replace(/\\/g, '/').split('/').pop() || '';
    return base.replace(/\.[^.]+$/, '');
  }

  static prettify(stem) {
    const trimmed = String(stem == null ? '' : stem).trim();
    if (!trimmed) return '';
    const name = ModelName._stripShardSuffix(ModelName._stripAuthorPrefix(trimmed));
    const tokens = name.split(/[-\s]+/).filter(Boolean);
    const out = ModelName._identityTokens(tokens).map(ModelNameToken.style).join(' ').replace(/\s+/g, ' ').trim();
    return out || name;
  }

  static resolveDisplayName({ stem, overrides } = {}) {
    const key = String(stem == null ? '' : stem);
    const override = overrides && overrides[key];
    if (typeof override === 'string' && override.trim()) return override.trim();
    return ModelName._catalogLabel(key) || ModelName.prettify(key);
  }

  static _stripAuthorPrefix(name) {
    return name.replace(/^[A-Za-z0-9.]+_(?=[A-Za-z])/, '');
  }

  static _stripShardSuffix(name) {
    return name.replace(/[-_. ]?\b\d{1,6}[-_. ]of[-_. ]\d{1,6}\b/ig, '');
  }

  static _identityTokens(tokens) {
    const kept = tokens.filter((t) => !ModelNameToken.isNoise(t));
    if (kept.length) return kept;
    const withoutQuant = tokens.filter((t) => !ModelNameToken.isQuantOrFormat(t));
    return withoutQuant.length ? withoutQuant : tokens;
  }

  static _catalogLabel(key) {
    const match = CuratedModelCatalog.MODELS.find((m) => m.fileBase && (key === m.fileBase || key.startsWith(m.fileBase + '-')));
    return match ? match.label : null;
  }
}

module.exports = ModelName;
