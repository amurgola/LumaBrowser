const fs = require('fs');
const path = require('path');

class ImageModelFiles {
  static WEIGHT_EXTS = new Set(['.gguf', '.safetensors', '.ckpt', '.bin', '.pth', '.pt']);

  static INFERRED_ROLES = ['diffusion', 'vae', 'audioVae', 'llm', 'clip_l', 't5xxl'];

  static async fromManifest(dir, manifestFiles) {
    const files = {};
    for (const role of Object.keys(manifestFiles)) {
      const entry = await ImageModelFiles._rehydrate(dir, role, manifestFiles[role]);
      if (entry) files[role] = entry;
    }
    return files;
  }

  static async infer(dir) {
    const names = await ImageModelFiles._weightFileNames(dir);
    const picks = ImageModelFiles._assignRoles(names);
    const files = {};
    for (const role of ImageModelFiles.INFERRED_ROLES) {
      if (picks[role]) files[role] = await ImageModelFiles._describe(dir, role, picks[role]);
    }
    return files;
  }

  static roleFor(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.includes('audio') && lower.includes('vae')) return 'audioVae';
    if (lower.startsWith('ae') || lower.includes('vae')) return 'vae';
    if (lower.includes('clip_l') || lower.includes('clip-l')) return 'clip_l';
    if (lower.includes('t5xxl') || lower.includes('t5-xxl')) return 't5xxl';
    if (lower.includes('qwen') || lower.includes('ministral') || lower.includes('text_encoder')) return 'llm';
    return 'diffusion';
  }

  static _assignRoles(names) {
    const picks = {};
    for (const name of names) {
      const role = ImageModelFiles.roleFor(name);
      if (!picks[role]) picks[role] = name;
    }
    return picks;
  }

  static async _weightFileNames(dir) {
    let entries;
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (_) {
      return [];
    }
    return entries
      .filter((entry) => entry.isFile() && ImageModelFiles.WEIGHT_EXTS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => entry.name);
  }

  static async _rehydrate(dir, role, entry) {
    if (!entry) return null;
    const base = entry.file || entry.name;
    if (!base) return null;
    const full = path.join(dir, base);
    const stat = await ImageModelFiles._stat(full);
    if (!stat) return null;
    return { ...entry, role, file: base, path: full, bytes: stat.size };
  }

  static async _describe(dir, role, name) {
    const full = path.join(dir, name);
    const stat = await ImageModelFiles._stat(full);
    return { role, file: name, path: full, bytes: stat ? stat.size : null };
  }

  static async _stat(filePath) {
    try {
      return await fs.promises.stat(filePath);
    } catch (_) {
      return null;
    }
  }
}

module.exports = ImageModelFiles;
