const path = require('path');
const ImagePromptProfiles = require('../prompt/ImagePromptProfiles');
const ImportBases = require('./ImportBases');

class ImportedEntryBuilder {
  static ALLOWED_LOADERS = Object.freeze(['-m', '--diffusion-model']);
  static FALLBACK_ID = 'custom-model';
  static MAX_ID_LENGTH = 80;
  static RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  static FLUX_SINGLE_FILE = 'Flux fine-tunes shipped as a single .safetensors file are missing the required text encoders. '
    + 'Pick the GGUF UNet quant instead: the import will reuse the standard Flux VAE + CLIP-L + T5-XXL companions.';

  static build(opts) {
    const invalid = ImportedEntryBuilder._validate(opts);
    if (invalid) return { error: invalid };
    const fileName = opts.srcPath ? path.basename(opts.srcPath) : ImportedEntryBuilder.filenameFromUrl(opts.url);
    if (!fileName) return { error: 'Could not infer a filename from the URL. Use a direct .safetensors / .gguf URL.' };
    const ext = path.extname(fileName).toLowerCase();
    if (opts.baseType === 'flux' && ext === '.safetensors') return { error: ImportedEntryBuilder.FLUX_SINGLE_FILE };
    return { entry: ImportedEntryBuilder._entry(opts, ImportedEntryBuilder._diffusionFile(opts, fileName, ext)) };
  }

  static sanitizeId(name) {
    const out = String(name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.-]+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, ImportedEntryBuilder.MAX_ID_LENGTH);
    if (!out || /^\.+$/.test(out) || ImportedEntryBuilder.RESERVED_NAME.test(out)) return ImportedEntryBuilder.FALLBACK_ID;
    return out;
  }

  static filenameFromUrl(url) {
    try {
      const last = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
      return decodeURIComponent(last) || null;
    } catch (_) {
      return null;
    }
  }

  static loaderFlag(baseType, requested, ext) {
    if (ImportBases.isSplitDiffusion(baseType)) return '--diffusion-model';
    if (ImportedEntryBuilder.ALLOWED_LOADERS.includes(requested)) return requested;
    return ext === '.gguf' ? '--diffusion-model' : '-m';
  }

  static _validate({ name, url, srcPath, baseType } = {}) {
    if (!name || typeof name !== 'string' || !name.trim()) return 'A display name is required.';
    if (!baseType || !ImportBases.get(baseType)) return `baseType must be one of: ${ImportBases.names().join(', ')}`;
    if (!url && !srcPath) return 'Either a URL or a local file path is required.';
    return null;
  }

  static _diffusionFile({ baseType, loaderFlag, url, approxBytes }, fileName, ext) {
    return {
      role: 'diffusion',
      file: fileName,
      loaderFlag: ImportedEntryBuilder.loaderFlag(baseType, loaderFlag, ext),
      ...(url ? { url } : {}),
      ...(typeof approxBytes === 'number' && approxBytes > 0 ? { approxBytes } : {}),
    };
  }

  static _entry(opts, diffusion) {
    const base = ImportBases.get(opts.baseType);
    const profileId = opts.promptStyle || ImagePromptProfiles.DEFAULT_PROFILE_BY_BASE[opts.baseType] || null;
    return {
      id: ImportedEntryBuilder.sanitizeId(opts.name),
      label: opts.name.trim(),
      family: base.family,
      kind: ImportedEntryBuilder._kind(opts.kind, base),
      ...(typeof base.supportsEdit === 'boolean' ? { supportsEdit: base.supportsEdit } : {}),
      ...(base.constraints ? { constraints: base.constraints } : {}),
      imported: true,
      baseType: opts.baseType,
      promptStyle: profileId || undefined,
      files: { diffusion },
      defaults: { ...(base.defaults || {}), ...ImagePromptProfiles.profileDefaultsPatch(profileId) },
      minVramBytes: base.minVramBytes,
      launchArgs: base.launchArgs || [],
      licenseNote: base.licenseNote || null,
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...ImportBases.COMPATIBLE_RUNTIMES],
    };
  }

  static _kind(requested, base) {
    if (requested === 'edit' || requested === 'generate') return requested;
    return base.kind || 'generate';
  }
}

module.exports = ImportedEntryBuilder;
