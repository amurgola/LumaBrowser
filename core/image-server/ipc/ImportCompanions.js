const fs = require('fs');
const path = require('path');
const ImportBases = require('./ImportBases');
const ImageModelManifest = require('./ImageModelManifest');

class ImportCompanions {
  static DEFAULT_VISION_FLAG = '--llm_vision';

  static QWEN_21_MISSING = 'No installed Qwen-Image 2.1 companion set (2.1 VAE + Qwen3-VL-8B text encoder + mmproj) found. '
    + 'Install "Qwen-Image 2.1" from the catalog first so its encoder can be reused by this checkpoint.';

  static QWEN_EDIT_MISSING = 'No installed Qwen-Image-Edit companion set (VAE + Qwen2.5-VL text encoder + mmproj) found. '
    + 'Install "Qwen-Image-Edit 2509" first so its encoder can be reused by this checkpoint.';

  static ANIMA_MISSING = 'No installed Anima companion set (Qwen-Image VAE + Qwen3 text encoder) found. '
    + 'Download "Anima" from the catalog first so its VAE + text encoder can be reused by this checkpoint.';

  static attach(entry, dir, modelsDir) {
    if (ImportBases.QWEN_COMPANION_BASES.includes(entry.baseType)) return ImportCompanions.attachQwen(entry, dir, modelsDir);
    if (entry.baseType === 'anima') return ImportCompanions.attachAnima(entry, dir, modelsDir);
    return null;
  }

  static attachQwen(entry, dir, modelsDir) {
    const wantFamily = (entry && entry.family) || 'qwen-image-edit';
    const sets = ImportCompanions._siblings(dir, modelsDir).filter((s) => s.fileOf('llm') && s.fileOf('vision') && s.fileOf('vae'));
    const comp = sets.find((s) => s.family === wantFamily)
      || (wantFamily === 'qwen-image-edit' ? sets.find((s) => !s.family) : null);
    if (!comp) return { error: wantFamily === 'qwen-image-2' ? ImportCompanions.QWEN_21_MISSING : ImportCompanions.QWEN_EDIT_MISSING };
    const visionFlag = (comp.files.vision && comp.files.vision.loaderFlag) || ImportCompanions.DEFAULT_VISION_FLAG;
    return ImportCompanions._link(entry, comp, dir, 'Qwen', [['vae'], ['llm'], ['vision', visionFlag]]);
  }

  static attachAnima(entry, dir, modelsDir) {
    const comp = ImportCompanions._siblings(dir, modelsDir)
      .find((s) => (s.family === 'anima' || s.id === 'anima') && s.fileOf('vae') && s.fileOf('llm'));
    if (!comp) return { error: ImportCompanions.ANIMA_MISSING };
    return ImportCompanions._link(entry, comp, dir, 'Anima', [['vae'], ['llm']]);
  }

  static _siblings(dir, modelsDir) {
    return ImportCompanions._subdirs(modelsDir)
      .filter((d) => path.resolve(d) !== path.resolve(dir))
      .map(ImportCompanions._readSibling)
      .filter(Boolean);
  }

  static _readSibling(dir) {
    let manifest;
    try { manifest = ImageModelManifest.read(dir); } catch (_) { return null; }
    if (!manifest) return null;
    const files = manifest.files || {};
    return {
      dir,
      id: manifest.id,
      family: manifest.family || null,
      files,
      fileOf: (role) => files[role] && (files[role].file || files[role].name),
    };
  }

  static _subdirs(modelsDir) {
    try {
      return fs.readdirSync(modelsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(modelsDir, d.name));
    } catch (_) {
      return [];
    }
  }

  static _link(entry, comp, dir, label, roles) {
    try {
      for (const [role, loaderFlag] of roles) {
        const file = ImportCompanions._place(comp.dir, dir, comp.fileOf(role));
        entry.files[role] = { role, file, ...(loaderFlag ? { loaderFlag } : {}) };
      }
    } catch (err) {
      return { error: `Failed to link ${label} companion files: ${err.message}` };
    }
    return { ok: true, from: path.basename(comp.dir) };
  }

  static _place(fromDir, toDir, name) {
    const dest = path.join(toDir, name);
    if (!fs.existsSync(dest)) {
      const src = path.join(fromDir, name);
      try { fs.linkSync(src, dest); } catch (_) { fs.copyFileSync(src, dest); }
    }
    return name;
  }
}

module.exports = ImportCompanions;
