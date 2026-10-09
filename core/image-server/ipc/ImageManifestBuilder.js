const ImageModelManifest = require('./ImageModelManifest');

class ImageManifestBuilder {
  static DEFAULT_PROTOCOL = 'sd-cpp-http';

  static forCatalog(entry, files, now = new Date()) {
    return {
      id: entry.id,
      label: entry.label,
      family: entry.family,
      kind: entry.kind || null,
      ...ImageManifestBuilder._capabilities(entry),
      files: ImageModelManifest.filesBag(files),
      defaults: entry.defaults || null,
      protocol: entry.protocol || ImageManifestBuilder.DEFAULT_PROTOCOL,
      compatibleRuntimes: entry.compatibleRuntimes || null,
      downloadedAt: now.toISOString(),
    };
  }

  static forImport(entry, now = new Date()) {
    return {
      id: entry.id,
      label: entry.label,
      family: entry.family,
      kind: entry.kind || 'generate',
      ...ImageManifestBuilder._editAndGrid(entry),
      imported: true,
      baseType: entry.baseType,
      promptStyle: entry.promptStyle || null,
      ...ImageManifestBuilder._installTail(entry, now),
      ...(entry.linkedFrom ? { linkedFrom: entry.linkedFrom } : {}),
    };
  }

  static forRepo(entry, now = new Date()) {
    return {
      id: entry.id,
      label: entry.label,
      family: entry.family,
      ...ImageManifestBuilder._installTail(entry, now),
    };
  }

  static _capabilities(entry) {
    return {
      ...(typeof entry.supportsI2V === 'boolean' ? { supportsI2V: entry.supportsI2V } : {}),
      ...ImageManifestBuilder._editAndGrid(entry),
    };
  }

  static _editAndGrid(entry) {
    return {
      ...(typeof entry.supportsEdit === 'boolean' ? { supportsEdit: entry.supportsEdit } : {}),
      ...(entry.constraints ? { constraints: entry.constraints } : {}),
    };
  }

  static _installTail(entry, now) {
    return {
      files: ImageModelManifest.filesBag(entry.files),
      defaults: entry.defaults || null,
      minVramBytes: entry.minVramBytes || null,
      launchArgs: entry.launchArgs || [],
      licenseNote: entry.licenseNote || null,
      protocol: entry.protocol || ImageManifestBuilder.DEFAULT_PROTOCOL,
      compatibleRuntimes: entry.compatibleRuntimes || null,
      downloadedAt: now.toISOString(),
    };
  }
}

module.exports = ImageManifestBuilder;
