const path = require('path');
const ImageModelCatalog = require('../models/ImageModelCatalog');
const ImageDownloadSlot = require('./ImageDownloadSlot');
const ImageManifestBuilder = require('./ImageManifestBuilder');
const ImageModelManifest = require('./ImageModelManifest');
const ImageQuantResolver = require('./ImageQuantResolver');

class CatalogModelInstaller {
  static BUSY = 'An image model download is already in progress.';

  constructor({ imageServerService, slot, catalog = new ImageModelCatalog() }) {
    this._svc = imageServerService;
    this._slot = slot;
    this._catalog = catalog;
  }

  install(args, send) {
    return ImageDownloadSlot.reportingFailures(send, () => this._install(args || {}, send));
  }

  async _install({ id, quant }, send) {
    const entry = id ? this._catalog.getById(id) : null;
    if (!entry) return { success: false, error: 'A catalog model id is required.' };
    if (!entry.files) return { success: false, error: `Catalog entry "${id}" has no files.` };
    const resolved = ImageQuantResolver.resolve(entry, quant);
    if (resolved.error) return { success: false, error: resolved.error };
    const dir = path.join(this._svc.getModelsDirConfig().effectivePath, entry.id);
    const files = CatalogModelInstaller.downloadList(resolved.files, dir);
    return this._slot.run({
      files,
      dir,
      send,
      busyError: CatalogModelInstaller.BUSY,
      start: { id, dir, files: ImageDownloadSlot.startFiles(files) },
      onDownloaded: () => {
        ImageModelManifest.writeQuietly(dir, ImageManifestBuilder.forCatalog(entry, resolved.files));
        send('done', { id, dir });
        return { success: true, id, dir };
      },
    });
  }

  static downloadList(files, dir) {
    return Object.keys(files).map((role) => ({ role, url: files[role].url, destPath: path.join(dir, files[role].file) }));
  }
}

module.exports = CatalogModelInstaller;
