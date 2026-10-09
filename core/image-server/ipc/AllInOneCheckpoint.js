const SafetensorsHeader = require('../models/SafetensorsHeader');

class AllInOneCheckpoint {
  static BAKED_PREFIXES = Object.freeze(['first_stage_model.', 'cond_stage_model.', 'conditioner.']);

  static ANIMA_ERROR =
    'This looks like an all-in-one checkpoint: it bakes in its own VAE / text '
    + 'encoder, not a CircleStone Labs Anima split UNet. Import it as SDXL (or '
    + 'SD 1.5 / Flux) instead; the "Anima" base is only for CircleStone Anima '
    + 'diffusion files that load against the separate Qwen-Image VAE + Qwen3 encoder.';

  static hasBakedVaeOrClip(filePath) {
    if (!filePath || !/\.safetensors$/i.test(filePath)) return false;
    try {
      const { json } = SafetensorsHeader.readFile(filePath);
      return Object.keys(json).some((key) => AllInOneCheckpoint.BAKED_PREFIXES.some((p) => key.startsWith(p)));
    } catch (_) {
      return false;
    }
  }
}

module.exports = AllInOneCheckpoint;
