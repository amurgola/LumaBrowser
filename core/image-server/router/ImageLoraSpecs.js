const fs = require('fs');
const path = require('path');

class ImageLoraSpecs {
  static KNOWN_EXTS = ['.safetensors', '.gguf', '.pt', '.pth'];

  static DEFAULT_EXT = '.safetensors';

  static resolve(md, lorasDir) {
    const loras = (md && Array.isArray(md.loras)) ? md.loras : [];
    const out = loras
      .filter((lora) => lora && lora.name)
      .map((lora) => ImageLoraSpecs._specFor(lora, lorasDir));
    return out.length ? out : null;
  }

  static _specFor(lora, lorasDir) {
    return {
      path: ImageLoraSpecs._fileFor(lora.name, lorasDir),
      multiplier: (typeof lora.weight === 'number' && Number.isFinite(lora.weight)) ? lora.weight : 1.0,
      ...(lora.highNoise ? { is_high_noise: true } : {}),
    };
  }

  static _fileFor(name, lorasDir) {
    const file = String(name).replace(/\\/g, '/');
    if (ImageLoraSpecs._hasKnownExt(file)) return file;
    return file + (ImageLoraSpecs._extOnDisk(file, lorasDir) || ImageLoraSpecs.DEFAULT_EXT);
  }

  static _hasKnownExt(file) {
    const lower = file.toLowerCase();
    return ImageLoraSpecs.KNOWN_EXTS.some((ext) => lower.endsWith(ext));
  }

  static _extOnDisk(file, lorasDir) {
    if (!lorasDir) return null;
    return ImageLoraSpecs.KNOWN_EXTS.find((ext) => {
      try { return fs.existsSync(path.join(lorasDir, `${file}${ext}`)); } catch (_) { return false; }
    }) || null;
  }
}

module.exports = ImageLoraSpecs;
