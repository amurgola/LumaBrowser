const LoraBaseDetector = require('../models/LoraBaseDetector');

class CivitaiLoraBaseMap {
  static NO_FAMILY = 'no-lora-family';

  static BASES = Object.freeze({
    'SD 1.4': 'sd-1-5',
    'SD 1.5': 'sd-1-5',
    'SD 1.5 LCM': 'sd-1-5',
    'SD 1.5 Hyper': 'sd-1-5',
    'SDXL 0.9': 'sdxl',
    'SDXL 1.0': 'sdxl',
    'SDXL 1.0 LCM': 'sdxl',
    'SDXL Lightning': 'sdxl',
    'SDXL Hyper': 'sdxl',
    'SDXL Turbo': 'sdxl',
    'SDXL Distilled': 'sdxl',
    'Illustrious': 'sdxl',
    'NoobAI': 'sdxl',
    'Pony': 'sdxl',
    'Flux.1 S': 'flux',
    'Flux.1 D': 'flux',
    'Flux.1 Krea': 'flux',
    'Flux.1 Kontext': 'flux-kontext',
    'Chroma': 'chroma',
    'Flux.2 D': 'flux2',
    'Flux.2 Klein 9B': 'flux2',
    'Flux.2 Klein 9B-base': 'flux2',
    'Flux.2 Klein 4B': 'flux2',
    'Flux.2 Klein 4B-base': 'flux2',
    'Flux.3': 'flux3',
    'Flux.3 Klein': 'flux3',
    'Flux.3 Klein-base': 'flux3',
    'Qwen': 'qwen-image',
    'Qwen 2.1': 'qwen-image-2-1',
    'ZImageTurbo': 'z-image',
    'ZImageBase': 'z-image',
    'Krea 2': 'krea2',
    'Krea 2 Turbo': 'krea2',
    'Anima': 'anima',
    'MOSS Image': 'moss-image',
    'Wan Video': 'wan-video',
    'Wan Video 1.3B t2v': 'wan-video',
    'Wan Video 14B t2v': 'wan-video',
    'Wan Video 14B i2v 480p': 'wan-video',
    'Wan Video 14B i2v 720p': 'wan-video',
    'Wan Video 2.2 TI2V-5B': 'wan-video',
    'Wan Video 2.2 I2V-A14B': 'wan-video',
    'Wan Video 2.2 T2V-A14B': 'wan-video',
    'MiniMax H3': 'minimax-h3',
    'MiniMax H3 Image': 'minimax-h3-image',
  });

  static resolve(baseModel) {
    const name = String(baseModel || '').trim();
    const base = CivitaiLoraBaseMap.BASES[name] || null;
    const known = base ? LoraBaseDetector.BASES[base] : null;
    if (!known) return CivitaiLoraBaseMap._unsupported(name);
    return { supported: true, baseModel: name, base, label: known.label, families: known.families.slice(), reason: null, note: null };
  }

  static baseModels() {
    return Object.keys(CivitaiLoraBaseMap.BASES);
  }

  static baseModelsForFamily(family) {
    return CivitaiLoraBaseMap.baseModels().filter((name) => CivitaiLoraBaseMap.resolve(name).families.includes(family));
  }

  static _unsupported(name) {
    const note = name
      ? `${name} LoRAs fit no image model family LumaBrowser runs.`
      : 'CivitAI lists no base model for this LoRA version.';
    return { supported: false, baseModel: name, base: null, label: null, families: [], reason: CivitaiLoraBaseMap.NO_FAMILY, note };
  }
}

module.exports = CivitaiLoraBaseMap;
