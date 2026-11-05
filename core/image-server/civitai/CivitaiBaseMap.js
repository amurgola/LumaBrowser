const ImportBases = require('../ipc/ImportBases');
const ImagePromptProfiles = require('../prompt/ImagePromptProfiles');

class CivitaiBaseMap {
  static NO_BASE = 'no-import-base';

  static UNSUPPORTED_ARCH = 'unsupported-architecture';

  static HOSTED = 'hosted-service';

  static VIDEO_PENDING = 'video-import-pending';

  static UNKNOWN = 'unknown-base';

  static IMPORTABLE = Object.freeze({
    'SD 1.4': { baseType: 'sd-1-5', profile: 'sd-1-5-generic' },
    'SD 1.5': { baseType: 'sd-1-5', profile: 'sd-1-5-generic' },
    'SD 1.5 LCM': { baseType: 'sd-1-5', profile: 'sd-1-5-generic', recipe: { steps: 8, cfgScale: 1.5, sampler: 'lcm' } },
    'SD 1.5 Hyper': { baseType: 'sd-1-5', profile: 'sd-1-5-generic', recipe: { steps: 8, cfgScale: 1.0 } },
    'SD 2.0': { baseType: 'sd-1-5', profile: 'sd-1-5-generic' },
    'SD 2.0 768': { baseType: 'sd-1-5', profile: 'sd-1-5-generic', recipe: { width: 768, height: 768 } },
    'SD 2.1': { baseType: 'sd-1-5', profile: 'sd-1-5-generic' },
    'SD 2.1 768': { baseType: 'sd-1-5', profile: 'sd-1-5-generic', recipe: { width: 768, height: 768 } },
    'SDXL 0.9': { baseType: 'sdxl', profile: 'sdxl-generic' },
    'SDXL 1.0': { baseType: 'sdxl', profile: 'sdxl-generic' },
    'SDXL Distilled': { baseType: 'sdxl', profile: 'sdxl-generic' },
    'SDXL Lightning': { baseType: 'sdxl', profile: 'sdxl-generic', recipe: { steps: 8, cfgScale: 1.5, sampler: 'euler_a', scheduler: 'sgm_uniform' } },
    'SDXL Hyper': { baseType: 'sdxl', profile: 'sdxl-generic', recipe: { steps: 8, cfgScale: 1.0 } },
    'SDXL Turbo': { baseType: 'sdxl', profile: 'sdxl-generic', recipe: { steps: 4, cfgScale: 1.0, width: 512, height: 512, sampler: 'euler_a', scheduler: 'sgm_uniform' } },
    'SDXL 1.0 LCM': { baseType: 'sdxl', profile: 'sdxl-generic', recipe: { steps: 8, cfgScale: 1.5, sampler: 'lcm' } },
    'Illustrious': { baseType: 'sdxl', profile: 'sdxl-illustrious' },
    'NoobAI': { baseType: 'sdxl', profile: 'sdxl-illustrious' },
    'Pony': { baseType: 'sdxl', profile: 'sdxl-pony' },
    'Flux.1 D': { baseType: 'flux' },
    'Flux.1 S': { baseType: 'flux', recipe: { steps: 4 } },
    'Flux.1 Krea': { baseType: 'flux' },
    'Flux.1 Kontext': { baseType: 'flux', kind: 'edit' },
    'Chroma': { baseType: 'flux', family: 'chroma', recipe: { steps: 26, cfgScale: 4.0, sampler: 'euler' } },
    'Qwen': { baseType: 'qwen-image-edit' },
    'Qwen 2.1': { baseType: 'qwen-image-2-1' },
    'Anima': { baseType: 'anima' },
  });

  static NO_BASE_YET = Object.freeze([
    'Flux.2 D', 'Flux.2 Klein 9B', 'Flux.2 Klein 9B-base', 'Flux.2 Klein 4B', 'Flux.2 Klein 4B-base',
    'Flux.3', 'Flux.3 Klein', 'Flux.3 Klein-base', 'MOSS Image', 'Qwen 2', 'Qwen 3',
    'SD 3', 'SD 3.5', 'SD 3.5 Large', 'SD 3.5 Large Turbo', 'SD 3.5 Medium', 'ZImageTurbo', 'ZImageBase',
    'Wan Image 2.7', 'Lumina',
  ]);

  static UNSUPPORTED = Object.freeze([
    'AuraFlow', 'Pony V7', 'HiDream', 'HiDream-O1', 'Kolors', 'PixArt a', 'PixArt E', 'Playground v2',
    'Stable Cascade', 'SD 2.1 Unclip', 'Hunyuan 1', 'Ming Image Design 0.1', 'Ming Image Design Layer 0.1',
  ]);

  static VIDEO = Object.freeze({
    'Wan Video': { family: 'wan-video' },
    'Wan Video 1.3B t2v': { family: 'wan-video' },
    'Wan Video 14B t2v': { family: 'wan-video' },
    'Wan Video 14B i2v 480p': { family: 'wan-video', supportsI2V: true },
    'Wan Video 14B i2v 720p': { family: 'wan-video', supportsI2V: true },
    'Wan Video 2.2 TI2V-5B': { family: 'wan-video', supportsI2V: true },
    'Wan Video 2.2 I2V-A14B': { family: 'wan-video', supportsI2V: true },
    'Wan Video 2.2 T2V-A14B': { family: 'wan-video' },
    'Wan Video 2.5 T2V': { family: 'wan-video' },
    'Wan Video 2.5 I2V': { family: 'wan-video', supportsI2V: true },
    'Wan Video 2.7': { family: 'wan-video' },
    'Wan Video 3.0': { family: 'wan-video' },
    'LTXV': { family: 'ltx-video' },
    'LTXV2': { family: 'ltx-video' },
    'LTXV 2.3': { family: 'ltx-video' },
    'LTXV 2.5': { family: 'ltx-video' },
    'MiniMax H3': { family: 'minimax-h3' },
    'Hunyuan Video': { family: null },
    'CogVideoX': { family: null },
    'Mochi': { family: null },
    'SVD': { family: null },
    'SVD XT': { family: null },
    'Flux 3 Video': { family: null },
  });

  static HOSTED_SERVICES = Object.freeze([
    'Nano Banana', 'OpenAI', 'Imagen4', 'Ideogram 4.0', 'Ideogram 4.5', 'Grok', 'Krea 2', 'Krea 2 Turbo', 'Krea 3',
    'Reve', 'MAI', 'Lens', 'Boogu', 'HappyHorse', 'Ernie', 'Muse Image', 'Seedream', 'Sora 2', 'Veo 3', 'Kling',
    'Seedance', 'Vidu Q1', 'MageFlow', 'ODOR',
  ]);

  static ASSET_KINDS = Object.freeze({
    Checkpoint: 'checkpoint',
    LORA: 'lora',
    LoCon: 'lora',
    DoRA: 'lora',
    VAE: 'vae',
    TextualInversion: 'embedding',
    Upscaler: 'upscaler',
    Controlnet: 'controlnet',
  });

  static INSTALLABLE_KINDS = Object.freeze(['checkpoint', 'lora']);

  static resolve(baseModel) {
    const name = CivitaiBaseMap.normalize(baseModel);
    if (!name) return CivitaiBaseMap._unsupported(name, CivitaiBaseMap.UNKNOWN, 'CivitAI lists no base model for this version.');
    const row = CivitaiBaseMap.IMPORTABLE[name];
    if (row) return CivitaiBaseMap._importable(name, row);
    if (CivitaiBaseMap.VIDEO[name]) {
      const video = CivitaiBaseMap.VIDEO[name];
      return {
        supported: false, baseModel: name, kind: 'video', family: video.family, supportsI2V: !!video.supportsI2V,
        reason: CivitaiBaseMap.VIDEO_PENDING,
        note: video.family
          ? `${name} is a video model; CivitAI video imports are not wired up yet (the catalog's ${video.family} rows are).`
          : `${name} is a video model LumaBrowser's runtimes do not run.`,
      };
    }
    if (CivitaiBaseMap.NO_BASE_YET.includes(name)) {
      return CivitaiBaseMap._unsupported(name, CivitaiBaseMap.NO_BASE, `${name} has no import base yet; use a curated catalog row of that family.`);
    }
    if (CivitaiBaseMap.UNSUPPORTED.includes(name)) {
      return CivitaiBaseMap._unsupported(name, CivitaiBaseMap.UNSUPPORTED_ARCH, `${name} is an architecture sd.cpp does not load.`);
    }
    if (CivitaiBaseMap.HOSTED_SERVICES.includes(name)) {
      return CivitaiBaseMap._unsupported(name, CivitaiBaseMap.HOSTED, `${name} is a hosted service; there are no weights to download.`);
    }
    return CivitaiBaseMap._unsupported(name, CivitaiBaseMap.UNKNOWN, `${name} is not a base LumaBrowser knows how to run.`);
  }

  static isImportable(baseModel) {
    return !!CivitaiBaseMap.IMPORTABLE[CivitaiBaseMap.normalize(baseModel)];
  }

  static baseModelsFor(baseType) {
    return Object.entries(CivitaiBaseMap.IMPORTABLE).filter(([, row]) => row.baseType === baseType).map(([name]) => name);
  }

  static importableBaseModels() {
    return Object.keys(CivitaiBaseMap.IMPORTABLE);
  }

  static assetKind(modelType) {
    const key = String(modelType || '').trim();
    return Object.prototype.hasOwnProperty.call(CivitaiBaseMap.ASSET_KINDS, key) ? CivitaiBaseMap.ASSET_KINDS[key] : null;
  }

  static isInstallableType(modelType) {
    const kind = CivitaiBaseMap.assetKind(modelType);
    return !!kind && CivitaiBaseMap.INSTALLABLE_KINDS.includes(kind);
  }

  static normalize(baseModel) {
    return String(baseModel || '').trim();
  }

  static _importable(name, row) {
    const base = ImportBases.get(row.baseType);
    const profile = row.profile || null;
    const defaults = {
      ...(base ? base.defaults : {}),
      ...(profile ? ImagePromptProfiles.profileDefaultsPatch(profile) : {}),
      ...(row.recipe || {}),
    };
    return {
      supported: true,
      baseModel: name,
      baseType: row.baseType,
      family: row.family || (base ? base.family : row.baseType),
      kind: row.kind || (base ? base.kind : 'generate'),
      profile,
      recipe: row.recipe ? { ...row.recipe } : null,
      defaults,
      reason: null,
      note: null,
    };
  }

  static _unsupported(name, reason, note) {
    return { supported: false, baseModel: name, baseType: null, family: null, kind: null, profile: null, recipe: null, defaults: null, reason, note };
  }
}

module.exports = CivitaiBaseMap;
