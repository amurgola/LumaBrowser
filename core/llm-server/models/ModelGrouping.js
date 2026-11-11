const ModelNameToken = require('./ModelNameToken');

class ModelGrouping {
  static QUANT = /^I?Q\d[\dA-Z_]*$/i;

  static FORMAT = /^(BF16|F16|F32|FP16|FP8|MXFP4|NVFP4)$/i;

  static SIZE = /^(\d+x)?\d+(\.\d+)?[BMT]$|^A\d+(\.\d+)?B$/i;

  static NOISE = /^(instruct|chat|it|base|hf|sft|dpo|gguf|ggml|ud|i\d|imat|imatrix)$/i;

  static LINE_TAGS = new Set(['vl', 'omni', 'coder']);

  static ACRONYMS = { gpt: 'GPT', oss: 'OSS', vl: 'VL', moe: 'MoE', glm: 'GLM', lfm: 'LFM' };

  static FORMAT_BITS = { F32: 32, BF16: 16, F16: 16, FP16: 16, FP8: 8, MXFP4: 4.25, NVFP4: 4.25 };

  static SUFFIX_BONUS = { 0: 0.5, 1: 0.55, K: 0.3, XL: 0.45, L: 0.35, M: 0.25, NL: 0.2, S: 0.15, XS: 0.1, XXS: 0.05 };

  static of(model, { customName = null } = {}) {
    const stem = ModelGrouping.stemOf(model);
    const g = (model && model.gguf) || {};
    const quant = ModelGrouping.quantOfStem(stem) || (g.fileTypeName ? String(g.fileTypeName).toUpperCase() : null);
    const tokens = ModelGrouping.tokens(stem);
    let parsed = ModelGrouping.parseFamily(tokens);
    if (!parsed) {
      const headerFamily = [g.baseName, g.name].map((t) => ModelGrouping.parseFamily(ModelGrouping.tokens(t))).find(Boolean);
      parsed = headerFamily ? { family: headerFamily.family, rest: tokens } : { family: null, rest: tokens };
    }
    const split = ModelGrouping._splitRest(parsed.rest);
    const words = split.words;
    const size = split.size || ModelGrouping.sizeFromCount(g.parameterCount);
    const custom = typeof customName === 'string' && customName.trim() ? customName.trim() : null;
    let line = size;
    let variant = ModelGrouping._style(words);
    if (!line && variant) { line = variant; variant = ''; }
    if (custom) variant = custom;
    return {
      family: parsed.family,
      line: line || '',
      sizeB: ModelGrouping.sizeBillions(size),
      variant,
      quant,
      quantBits: ModelGrouping.quantBits(quant),
      label: ModelGrouping._label(parsed.family, line, variant, quant, custom, model),
    };
  }

  static attach(models, overrides = {}) {
    for (const m of models || []) {
      if (!m) continue;
      const key = ModelGrouping.stemKey(m);
      const custom = overrides && Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : null;
      m.grouping = ModelGrouping.of(m, { customName: custom });
    }
    return models;
  }

  static stemKey(m) {
    if (!m) return '';
    if (m.nameKey) return m.nameKey;
    const path = (m.weights && m.weights[0] && m.weights[0].path) || m.path || '';
    return String(path).replace(/\\/g, '/').split('/').pop().replace(/\.[^.]+$/, '');
  }

  static stemOf(model) {
    if (!model) return '';
    const path = (model.weights && model.weights[0] && model.weights[0].path) || model.path;
    const base = path ? String(path).replace(/\\/g, '/').split('/').pop() : (model.nameKey || model.name || '');
    return String(base).replace(/\.gguf$/i, '').replace(/[-_.]\d{1,6}-of-\d{1,6}$/i, '');
  }

  static quantOfStem(stem) {
    const tokens = String(stem || '').split(/[-.\s]+/);
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      if (ModelGrouping.QUANT.test(t) || ModelGrouping.FORMAT.test(t)) {
        return (tokens[i - 1] && /^ud$/i.test(tokens[i - 1]) ? 'UD-' : '') + t.toUpperCase();
      }
    }
    return null;
  }

  static quantBits(quant) {
    if (!quant) return 0;
    const q = String(quant).toUpperCase().replace(/^UD-/, '');
    if (ModelGrouping.FORMAT_BITS[q] != null) return ModelGrouping.FORMAT_BITS[q];
    const m = q.match(/^(I?)Q(\d)(?:_([0-9]|K))?(?:_(XXS|XS|S|M|L|XL|NL))?/);
    if (!m) return 0;
    const bonus = m[4] ? ModelGrouping.SUFFIX_BONUS[m[4]] : (m[3] ? ModelGrouping.SUFFIX_BONUS[m[3]] || 0 : 0);
    return Number(m[2]) + bonus - (m[1] ? 0.02 : 0);
  }

  static sizeFromCount(count) {
    const n = Number(count);
    if (!Number.isFinite(n) || n <= 0) return '';
    const b = n / 1e9;
    if (b >= 10) return `${Math.round(b)}B`;
    if (b >= 1) return `${Math.round(b * 10) / 10}B`;
    return `${Math.round(n / 1e6)}M`;
  }

  static sizeBillions(size) {
    const m = String(size || '').match(/(?:(\d+)x)?(\d+(?:\.\d+)?)([BMT])/i);
    if (!m) return null;
    const unit = { B: 1, M: 0.001, T: 1000 }[m[3].toUpperCase()];
    return Number(m[2]) * unit * (m[1] ? Number(m[1]) : 1);
  }

  static tokens(text) {
    const s = String(text || '').trim().replace(/^[A-Za-z0-9.]+_(?=[A-Za-z])/, '');
    const out = [];
    for (const raw of s.split(/[-\s]+|\.(?=[A-Za-z])/)) {
      if (!raw) continue;
      const glued = !ModelGrouping.QUANT.test(raw) && !ModelGrouping.FORMAT.test(raw) && raw.match(/^([A-Za-z]{3,})(\d[\d.]*)$/);
      if (!glued) { out.push(raw); continue; }
      out.push(glued[1], /^\d\d$/.test(glued[2]) ? `${glued[2][0]}.${glued[2][1]}` : glued[2]);
    }
    return out;
  }

  static parseFamily(tokens) {
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (ModelGrouping._ends(t)) {
        return out.length && ModelGrouping.SIZE.test(t) ? { family: ModelGrouping._style(out), rest: tokens.slice(i) } : null;
      }
      out.push(t);
      if (/\d/.test(t)) {
        let end = i + 1;
        if (tokens[end] && ModelGrouping.LINE_TAGS.has(tokens[end].toLowerCase())) out.push(tokens[end++]);
        return { family: ModelGrouping._style(out), rest: tokens.slice(end) };
      }
    }
    return null;
  }

  static _splitRest(rest) {
    const sizes = [];
    const words = [];
    let sizeDone = false;
    for (const t of rest || []) {
      if (ModelGrouping.SIZE.test(t) && !sizeDone) { sizes.push(t.toUpperCase()); continue; }
      if (sizes.length) sizeDone = true;
      if (ModelGrouping.QUANT.test(t) || ModelGrouping.FORMAT.test(t) || ModelGrouping.NOISE.test(t)) continue;
      words.push(t);
    }
    return { size: sizes.join(' '), words };
  }

  static _ends(t) {
    return ModelGrouping.SIZE.test(t) || ModelGrouping.QUANT.test(t) || ModelGrouping.FORMAT.test(t) || ModelGrouping.NOISE.test(t);
  }

  static _style(tokens) {
    return (tokens || []).map((t) => {
      const lower = t.toLowerCase();
      if (ModelGrouping.ACRONYMS[lower]) return ModelGrouping.ACRONYMS[lower];
      return ModelNameToken.style(t);
    }).join(' ').replace(/\s+/g, ' ').trim();
  }

  static _label(family, line, variant, quant, custom, model) {
    const head = custom || [family, line, variant].filter(Boolean).join(' ') || (model && (model.nameKey || model.name)) || '';
    return quant ? `${head} · ${quant}` : head;
  }
}

module.exports = ModelGrouping;
