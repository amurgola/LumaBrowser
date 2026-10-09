const path = require('path');
const SafetensorsHeader = require('../SafetensorsHeader');

class CheckpointClassifier {
  static NEEDS_COMPANIONS = 'needs separate text encoder and VAE files, so it cannot be linked on its own. Install the catalog version instead.';

  static classify(filePath, hint) {
    const file = path.basename(filePath);
    const ext = path.extname(file).toLowerCase();
    if (ext === '.gguf') return CheckpointClassifier._incompatible('GGUF', `A GGUF diffusion model ${CheckpointClassifier.NEEDS_COMPANIONS}`);
    if (ext === '.ckpt') return CheckpointClassifier._classifyPickle(hint);
    const keys = CheckpointClassifier._readKeys(filePath);
    if (!keys) return CheckpointClassifier._incompatible('Unknown', 'The file header could not be read.');
    return CheckpointClassifier._classifyKeys(keys, file);
  }

  static guessPromptStyle(baseType, fileName) {
    if (baseType !== 'sdxl') return undefined;
    if (/pony/i.test(fileName)) return 'sdxl-pony';
    if (/illustrious|noob|ilxl|(^|[^a-z])wai([^a-z]|$)/i.test(fileName)) return 'sdxl-illustrious';
    return undefined;
  }

  static _classifyPickle(hint) {
    if (hint && hint.allInOne === false) return CheckpointClassifier._incompatible('Checkpoint', `This file ${CheckpointClassifier.NEEDS_COMPANIONS}`);
    return { compatible: true, baseType: 'sd-1-5', archLabel: 'SD 1.5', guessed: true };
  }

  static _classifyKeys(keys, file) {
    const has = (prefix) => keys.some((k) => k.startsWith(prefix));
    const hasPart = (part) => keys.some((k) => k.includes(part));
    const bakedVae = has('first_stage_model.');
    if (has('conditioner.embedders.1.')) return CheckpointClassifier._sdxl(bakedVae, file);
    if (has('conditioner.embedders.0.')) return CheckpointClassifier._incompatible('SDXL refiner', 'SDXL refiner models are not used on their own.');
    if (has('cond_stage_model.transformer.')) return CheckpointClassifier._sd15(bakedVae);
    if (has('cond_stage_model.model.')) return CheckpointClassifier._incompatible('SD 2.x', 'SD 2.x checkpoints are not supported yet.');
    return CheckpointClassifier._classifyDiffusionOnly(has, hasPart);
  }

  static _classifyDiffusionOnly(has, hasPart) {
    const needs = CheckpointClassifier.NEEDS_COMPANIONS;
    if (hasPart('double_blocks.')) return CheckpointClassifier._incompatible('Flux', `A Flux model ${needs}`);
    if (hasPart('joint_blocks.')) return CheckpointClassifier._incompatible('SD3', `An SD3 model ${needs}`);
    if (has('model.diffusion_model.') || hasPart('transformer_blocks.')) {
      return CheckpointClassifier._incompatible('Diffusion model', `This diffusion-only file ${needs}`);
    }
    return CheckpointClassifier._incompatible('Unknown', 'Not a recognised Stable Diffusion checkpoint.');
  }

  static _sdxl(bakedVae, file) {
    if (!bakedVae) return CheckpointClassifier._incompatible('SDXL', 'This SDXL file has no built-in VAE.');
    return { compatible: true, baseType: 'sdxl', archLabel: 'SDXL', promptStyle: CheckpointClassifier.guessPromptStyle('sdxl', file) };
  }

  static _sd15(bakedVae) {
    if (!bakedVae) return CheckpointClassifier._incompatible('SD 1.5', 'This SD 1.5 file has no built-in VAE.');
    return { compatible: true, baseType: 'sd-1-5', archLabel: 'SD 1.5' };
  }

  static _incompatible(archLabel, reason) {
    return { compatible: false, archLabel, reason };
  }

  static _readKeys(filePath) {
    try {
      return SafetensorsHeader.tensorNames(SafetensorsHeader.readFile(filePath).json);
    } catch (_) {
      return null;
    }
  }
}

module.exports = CheckpointClassifier;
