const fs = require('fs');

class LoraSidecar {
  static SUFFIX = '.lora.json';
  static LORA_EXT = /\.safetensors$/i;
  static FIELDS = ['family', 'recipeId', 'trainedFor', 'trigger', 'trainer', 'steps', 'createdAt'];
  static TEXT_MAX = 200;

  static pathFor(loraPath) {
    return String(loraPath).replace(LoraSidecar.LORA_EXT, '') + LoraSidecar.SUFFIX;
  }

  static read(loraPath) {
    try {
      const parsed = JSON.parse(fs.readFileSync(LoraSidecar.pathFor(loraPath), 'utf8'));
      return parsed && typeof parsed === 'object' ? LoraSidecar.clean(parsed) : null;
    } catch (_) {
      return null;
    }
  }

  static write(loraPath, meta) {
    const clean = LoraSidecar.clean(meta);
    if (!Object.keys(clean).length) return null;
    fs.writeFileSync(LoraSidecar.pathFor(loraPath), JSON.stringify(clean, null, 2));
    return clean;
  }

  static clean(meta) {
    const out = {};
    for (const field of LoraSidecar.FIELDS) {
      const value = meta ? meta[field] : null;
      if (typeof value === 'string' && value.trim()) out[field] = value.trim().slice(0, LoraSidecar.TEXT_MAX);
      else if (typeof value === 'number' && Number.isFinite(value)) out[field] = value;
    }
    return out;
  }
}

module.exports = LoraSidecar;
