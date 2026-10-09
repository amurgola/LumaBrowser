const ModelFileUpdates = require('./models/ModelFileUpdates');

class ImageModelRecord {
  static DEFAULT_PROTOCOL = 'sd-cpp-http';

  static DEFAULT_RUNTIMES = ['sd-cpp-cuda12', 'sd-cpp-vulkan', 'sd-cpp-cpu'];

  static RUNTIME_ALIASES = { 'sd-cpp-cuda12': ['sd-cpp-luma'] };

  static KINDS = ['generate', 'edit', 'video'];

  static EDIT_FAMILIES = new Set(['qwen-image-edit', 'flux-kontext']);

  static VIDEO_FAMILIES = new Set(['wan-video', 'ltx-video', 'minimax-h3']);

  static I2V_ID = /(^|[^a-z])(i2v|ti2v|flf2v)([^a-z]|$)/i;

  static build({ id, dir, manifest, files, catalogEntry, catalogList }) {
    const sources = { catalogEntry, manifest };
    const family = ImageModelRecord._pick(sources, 'family');
    const kind = ImageModelRecord.resolveKind({ catalogEntry, manifest, family });
    return {
      id,
      name: id,
      label: ImageModelRecord._pick(sources, 'label') || id,
      dir,
      family,
      kind,
      supportsI2V: kind === 'video' ? ImageModelRecord.resolveSupportsI2V({ catalogEntry, manifest, id }) : undefined,
      supportsEdit: ImageModelRecord._supportsEditFor(kind, sources),
      files,
      minVramBytes: (catalogEntry && catalogEntry.minVramBytes) || null,
      defaults: ImageModelRecord.layerDefaults(catalogEntry, manifest),
      constraints: ImageModelRecord._pick(sources, 'constraints'),
      protocol: ImageModelRecord._pick(sources, 'protocol') || ImageModelRecord.DEFAULT_PROTOCOL,
      compatibleRuntimes: ImageModelRecord.withRuntimeAliases(
        ImageModelRecord._pick(sources, 'compatibleRuntimes') || ImageModelRecord.DEFAULT_RUNTIMES
      ),
      launchArgs: ImageModelRecord._pick(sources, 'launchArgs') || [],
      licenseNote: ImageModelRecord._pick(sources, 'licenseNote'),
      fileUpdates: ImageModelRecord._fileUpdates({ id, family, files }, catalogList),
      manifest: manifest || null,
    };
  }

  static layerDefaults(catalogEntry, manifest) {
    const fromManifest = (manifest && manifest.defaults) || null;
    if (!(catalogEntry && catalogEntry.defaults)) return fromManifest;
    return Object.assign({}, catalogEntry.defaults, fromManifest || {});
  }

  static resolveKind({ catalogEntry, manifest, family }) {
    const stored = (manifest && manifest.kind) || (catalogEntry && catalogEntry.kind) || null;
    if (ImageModelRecord.KINDS.includes(stored)) return stored;
    if (family && ImageModelRecord.VIDEO_FAMILIES.has(family)) return 'video';
    if (family && ImageModelRecord.EDIT_FAMILIES.has(family)) return 'edit';
    return 'generate';
  }

  static resolveSupportsI2V({ catalogEntry, manifest, id }) {
    if (catalogEntry && typeof catalogEntry.supportsI2V === 'boolean') return catalogEntry.supportsI2V;
    if (manifest && typeof manifest.supportsI2V === 'boolean') return manifest.supportsI2V;
    return ImageModelRecord.I2V_ID.test(String(id || ''));
  }

  static resolveSupportsEdit({ catalogEntry, manifest }) {
    if (catalogEntry && typeof catalogEntry.supportsEdit === 'boolean') return catalogEntry.supportsEdit;
    if (manifest && typeof manifest.supportsEdit === 'boolean') return manifest.supportsEdit;
    return false;
  }

  static withRuntimeAliases(ids) {
    const out = [];
    const add = (id) => { if (!out.includes(id)) out.push(id); };
    for (const id of ids || []) {
      add(id);
      for (const alias of ImageModelRecord.RUNTIME_ALIASES[id] || []) add(alias);
    }
    return out;
  }

  static _supportsEditFor(kind, sources) {
    if (kind === 'edit') return true;
    if (kind === 'video') return false;
    return ImageModelRecord.resolveSupportsEdit(sources);
  }

  static _pick({ catalogEntry, manifest }, field) {
    return (catalogEntry && catalogEntry[field]) || (manifest && manifest[field]) || null;
  }

  static _fileUpdates(model, catalogList) {
    try {
      return ModelFileUpdates.findFileUpdates(model, catalogList);
    } catch (_) {
      return [];
    }
  }
}

module.exports = ImageModelRecord;
