const path = require('path');
const ImageLoraCatalog = require('../models/ImageLoraCatalog');
const ImageModelCatalog = require('../models/ImageModelCatalog');
const ImageDownloadSlot = require('./ImageDownloadSlot');
const ImageManifestBuilder = require('./ImageManifestBuilder');
const ImageModelManifest = require('./ImageModelManifest');
const ImageQuantResolver = require('./ImageQuantResolver');

class CatalogModelInstaller {
  static BUSY = 'An image model download is already in progress.';

  constructor({ imageServerService, slot, catalog = new ImageModelCatalog(), loras = null, attacher = null, loraCatalog = new ImageLoraCatalog() }) {
    this._svc = imageServerService;
    this._slot = slot;
    this._catalog = catalog;
    this._loras = loras;
    this._attacher = attacher;
    this._loraCatalog = loraCatalog;
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
    const result = await this._slot.run({
      files,
      dir,
      send,
      busyError: CatalogModelInstaller.BUSY,
      start: { id, dir, files: ImageDownloadSlot.startFiles(files) },
      onDownloaded: () => {
        ImageModelManifest.writeQuietly(dir, ImageManifestBuilder.forCatalog(entry, resolved.files));
        return { success: true, id, dir };
      },
    });
    if (!(result && result.success)) return result;
    await this._attachRecommendedLora(entry, send);
    send('done', { id, dir });
    return result;
  }

  async _attachRecommendedLora(entry, send) {
    const loraId = entry.recommendedLora;
    if (!loraId || !this._loras || !this._attacher) return;
    try {
      const got = await this._loras.download({ id: loraId }, CatalogModelInstaller._relay(send, entry));
      if (!(got && got.success)) throw new Error((got && got.error) || 'download failed');
      const curated = this._loraCatalog.getById(loraId);
      await this._attacher.attach({
        id: entry.id,
        loras: [{ name: got.name }],
        distilledPreset: true,
        preset: (curated && curated.preset) || null,
      });
    } catch (err) {
      console.warn(`[image-server] "${entry.id}" installed without its recommended LoRA ${loraId}: ${err.message}`);
    }
  }

  static _relay(send, entry) {
    return (type, payload) => {
      if (type === 'done' || type === 'error') return;
      if (type === 'start') send('start', { ...(payload || {}), id: entry.id });
      else send(type, payload);
    };
  }

  static downloadList(files, dir) {
    return Object.keys(files).map((role) => {
      const row = files[role];
      const item = { role, url: row.url, destPath: path.join(dir, row.file) };
      if (Number(row.size) > 0) item.expectedSize = Number(row.size);
      if (row.sha256) item.expectedSha256 = row.sha256;
      return item;
    });
  }
}

module.exports = CatalogModelInstaller;
