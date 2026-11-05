const CivitaiSamplerMap = require('./CivitaiSamplerMap');

class CivitaiMetaConsensus {
  static MIN_SAMPLES = 3;

  static STEPS = Object.freeze({ min: 1, max: 150 });

  static CFG = Object.freeze({ min: 0, max: 30 });

  static SIZE = Object.freeze({ min: 256, max: 4096 });

  static CLIP_SKIP = Object.freeze({ min: 1, max: 12 });

  static MIN_NEGATIVE_AGREEMENT = 2;

  static consensus(metas, { minSamples = CivitaiMetaConsensus.MIN_SAMPLES } = {}) {
    const rows = (Array.isArray(metas) ? metas : []).filter((m) => m && typeof m === 'object');
    if (rows.length < minSamples) return null;
    const steps = CivitaiMetaConsensus.median(rows.map((m) => CivitaiMetaConsensus._int(m.steps, CivitaiMetaConsensus.STEPS)));
    const cfg = CivitaiMetaConsensus.median(rows.map((m) => CivitaiMetaConsensus._num(m.cfgScale, CivitaiMetaConsensus.CFG)));
    const clipSkip = CivitaiMetaConsensus.mode(rows.map((m) => CivitaiMetaConsensus._int(m.clipSkip, CivitaiMetaConsensus.CLIP_SKIP)));
    const samplerLabel = CivitaiMetaConsensus.mode(rows.map((m) => CivitaiMetaConsensus._text(m.sampler)));
    const schedulerLabel = CivitaiMetaConsensus.mode(rows.map((m) => CivitaiMetaConsensus._text(m['Schedule type'] || m.scheduler)));
    const size = CivitaiMetaConsensus.mode(rows.map((m) => CivitaiMetaConsensus.sizeOf(m)));
    const negative = CivitaiMetaConsensus.mode(rows.map((m) => CivitaiMetaConsensus._prompt(m.negativePrompt)), CivitaiMetaConsensus.MIN_NEGATIVE_AGREEMENT);
    const resolved = samplerLabel.value || schedulerLabel.value
      ? CivitaiSamplerMap.resolve(samplerLabel.value, schedulerLabel.value || undefined)
      : null;
    const defaults = {};
    if (steps.value != null) defaults.steps = steps.value;
    if (cfg.value != null) defaults.cfgScale = Math.round(cfg.value * 2) / 2;
    if (resolved && resolved.sampler) {
      defaults.sampler = resolved.sampler;
      if (resolved.scheduler) defaults.scheduler = resolved.scheduler;
    }
    if (size.value) {
      const [w, h] = size.value.split('x').map(Number);
      defaults.width = w;
      defaults.height = h;
    }
    if (negative.value) defaults.negativePrompt = negative.value;
    if (Object.keys(defaults).length === 0) return null;
    return {
      samples: rows.length,
      defaults,
      samplerExact: resolved ? resolved.exact : null,
      evidence: {
        steps: steps.count, cfgScale: cfg.count, sampler: samplerLabel, scheduler: schedulerLabel, size, negativePrompt: { count: negative.count }, clipSkip,
      },
    };
  }

  static median(values) {
    const nums = values.filter((v) => v != null).sort((a, b) => a - b);
    if (nums.length === 0) return { value: null, count: 0 };
    const mid = Math.floor(nums.length / 2);
    const value = nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    return { value, count: nums.length };
  }

  static mode(values, minCount = 1) {
    const counts = new Map();
    for (const v of values) {
      if (v == null || v === '') continue;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    let best = null;
    for (const [value, count] of counts) if (!best || count > best.count) best = { value, count };
    if (!best || best.count < minCount) return { value: null, count: best ? best.count : 0 };
    return best;
  }

  static sizeOf(meta) {
    let w = CivitaiMetaConsensus._int(meta.width, CivitaiMetaConsensus.SIZE);
    let h = CivitaiMetaConsensus._int(meta.height, CivitaiMetaConsensus.SIZE);
    if ((w == null || h == null) && typeof meta.Size === 'string') {
      const m = /^\s*(\d+)\s*[x×]\s*(\d+)\s*$/i.exec(meta.Size);
      if (m) {
        w = CivitaiMetaConsensus._int(m[1], CivitaiMetaConsensus.SIZE);
        h = CivitaiMetaConsensus._int(m[2], CivitaiMetaConsensus.SIZE);
      }
    }
    return w != null && h != null ? `${w}x${h}` : null;
  }

  static _int(value, range) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < range.min || n > range.max) return null;
    return n;
  }

  static _num(value, range) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < range.min || n > range.max) return null;
    return n;
  }

  static _text(value) {
    const text = String(value == null ? '' : value).trim();
    return text || null;
  }

  static _prompt(value) {
    const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    return text && text.length <= 2000 ? text : null;
  }
}

module.exports = CivitaiMetaConsensus;
