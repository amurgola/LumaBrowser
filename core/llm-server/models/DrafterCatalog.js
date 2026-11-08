const GgufFileName = require('./GgufFileName');
const ModelFamilies = require('../server/ModelFamilies');

class DrafterCatalog {
  static ENGINE_RUNTIMES = Object.freeze({ 'llama-cpp': ['llama-cpp-', 'ik-llama'] });

  static MAX_QUANT_BITS = 8;

  static ENTRIES = [
    {
      id: 'qwen38-27b-dflash2',
      family: 'qwen38',
      label: 'DFlash2',
      target: 'Qwen3.8-27B',
      targetPattern: /\bqwen[-_ ]?3\.8[-_ ]?27b\b/i,
      repo: 'z-lab/Qwen3.8-27B-DFlash2-GGUF',
      preferredQuant: 'Q8_0',
      approxBytes: 2056414816,
      blockSize: 8,
      engines: ['llama-cpp'],
      blurb: 'Measured 2026-11-08 on an RTX 5090 with the UD-Q6_K_M weights: 140 tok/s at short context against '
        + '110 with the grafted MTP head and 58 plain, and 60 against 40 plain at 120k context. Greedy output stays '
        + 'that of the main model. Costs about 3.5 GB of VRAM at 128k context (drafter weights plus the recurrent-state '
        + 'checkpoints a hybrid target keeps per drafted token).',
      licenseNote: 'Apache-2.0 (z-lab).',
    },
    {
      id: 'muse-glimmer-30b-dflash2',
      family: 'muse-glimmer',
      label: 'DFlash2',
      target: 'Muse Glimmer 30B',
      targetPattern: /\bmuse[-_ ]?glimmer[-_ ]?30b\b/i,
      repo: 'z-lab/Muse-Glimmer-30B-DFlash2-GGUF',
      preferredQuant: 'Q8_0',
      approxBytes: 2959518912,
      blockSize: 8,
      engines: ['llama-cpp'],
      blurb: 'inco.ai\'s DFlash2 drafter for Meta\'s Muse Glimmer 30B, mirrored by z-lab. Not measured here; the '
        + 'publisher reports lossless greedy output and a block of 8 drafted tokens per step.',
      licenseNote: 'Apache-2.0 (z-lab).',
    },
  ];

  static list() {
    return DrafterCatalog.ENTRIES;
  }

  static getById(id) {
    return DrafterCatalog.ENTRIES.find((entry) => entry.id === id) || null;
  }

  static forFamily(family) {
    return family ? DrafterCatalog.ENTRIES.find((entry) => entry.family === family) || null : null;
  }

  static entryFor(model) {
    if (!model || model.kind !== 'weights' || (model.role && model.role !== 'main')) return null;
    const family = ModelFamilies.detect(model);
    if (!family) return null;
    const haystack = ModelFamilies.nameHaystack(model);
    return DrafterCatalog.ENTRIES.find((entry) => entry.family === family && entry.targetPattern.test(haystack)) || null;
  }

  static entryForDownload(repoId, file) {
    const name = String(file || '');
    if (!name || GgufFileName.roleHint(name) === 'draft' || GgufFileName.isMmproj(GgufFileName.basename(name))) return null;
    const haystack = `${repoId || ''} ${name}`;
    const family = ModelFamilies.detect({ name: haystack });
    if (!family) return null;
    return DrafterCatalog.ENTRIES.find((entry) => entry.family === family && entry.targetPattern.test(haystack)) || null;
  }

  static pickFile(entry, files) {
    const ggufs = (Array.isArray(files) ? files : [])
      .filter((f) => f && GgufFileName.isGguf(f.path) && !GgufFileName.isMmproj(GgufFileName.basename(f.path)));
    if (!ggufs.length) return null;
    const want = String((entry && entry.preferredQuant) || '').toUpperCase();
    const score = (f) => {
      const quant = GgufFileName.quantOf(GgufFileName.basename(f.path));
      if (want && quant === want) return 1000;
      const bits = GgufFileName.bitWidth(quant) || 0;
      return bits > 0 && bits <= DrafterCatalog.MAX_QUANT_BITS ? bits : 0;
    };
    return ggufs.sort((a, b) => score(b) - score(a) || (Number(a.size) || 0) - (Number(b.size) || 0))[0];
  }

  static engineSupported(entry, model) {
    const runtimes = Array.isArray(model && model.compatibleRuntimes) ? model.compatibleRuntimes : [];
    if (!runtimes.length) return true;
    const prefixes = (entry.engines || []).flatMap((engine) => DrafterCatalog.ENGINE_RUNTIMES[engine] || []);
    return runtimes.some((id) => prefixes.some((prefix) => String(id).startsWith(prefix)));
  }

  static offerFor(model) {
    const entry = DrafterCatalog.entryFor(model);
    if (!entry) return null;
    return {
      ...DrafterCatalog.describe(entry),
      installed: DrafterCatalog._has(model.drafter) || DrafterCatalog._has(model.drafterAuto),
      engineSupported: DrafterCatalog.engineSupported(entry, model),
    };
  }

  static _has(files) {
    return Array.isArray(files) && files.length > 0;
  }

  static describe(entry) {
    const { targetPattern, ...rest } = entry;
    return { ...rest, engines: (entry.engines || []).slice() };
  }
}

module.exports = DrafterCatalog;
