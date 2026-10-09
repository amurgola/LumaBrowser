const fs = require('fs');
const path = require('path');
const ImageModelCatalog = require('../models/ImageModelCatalog');
const ModelFileUpdates = require('../models/ModelFileUpdates');
const ImageDownloadSlot = require('./ImageDownloadSlot');
const ImageModelManifest = require('./ImageModelManifest');
const ImageSlots = require('./ImageSlots');

class ModelFileUpdater {
  constructor({ imageServerService, slot, catalog = new ImageModelCatalog() }) {
    this._svc = imageServerService;
    this._slot = slot;
    this._catalog = catalog;
    this._slots = new ImageSlots(imageServerService);
  }

  update(args, send) {
    return ImageDownloadSlot.reportingFailures(send, () => this._update(args || {}, send));
  }

  async _update({ id, role }, send) {
    const target = this._resolveTarget(id, role);
    if (target.error) return { success: false, error: target.error };
    const { dir, manifest, update } = target;
    const files = [{ role, url: update.url, destPath: path.join(dir, update.file) }];
    return this._slot.run({
      files,
      dir,
      send,
      start: { id, dir, files: [{ role, file: update.file }] },
      onDownloaded: () => this._apply({ id, role, dir, manifest, update, send }),
    });
  }

  _resolveTarget(id, role) {
    if (!id || typeof id !== 'string') return { error: 'id required' };
    if (!role || typeof role !== 'string') return { error: 'role required' };
    const dir = ImageModelManifest.modelDir(this._svc.getModelsDirConfig().effectivePath, id);
    if (!dir) return { error: 'invalid model id' };
    if (!ImageModelManifest.exists(dir)) return { error: 'This model has no manifest to update.' };
    let manifest;
    try { manifest = ImageModelManifest.read(dir); } catch (err) { return { error: 'Could not read manifest: ' + err.message }; }
    const update = this._updateFor(id, role, manifest);
    if (!update) return { error: `No catalog update for the "${role}" file of ${id}.` };
    if (this._slot.busy) return { error: ImageDownloadSlot.BUSY };
    return { dir, manifest, update };
  }

  _updateFor(id, role, manifest) {
    const model = { id, family: manifest.family || null, files: manifest.files || {} };
    return ModelFileUpdates.findFileUpdates(model, this._catalog.list()).find((u) => u.role === role) || null;
  }

  async _apply({ id, role, dir, manifest, update, send }) {
    ModelFileUpdater.repoint(manifest, role, update);
    ImageModelManifest.write(dir, manifest);
    await this._slots.stopHosting(id);
    ModelFileUpdater._removeSuperseded(dir, update);
    send('done', { id, dir });
    return { success: true, id, role, file: update.file, replaced: update.replaces || null };
  }

  static repoint(manifest, role, update, now = new Date()) {
    const prev = (manifest.files && manifest.files[role]) || {};
    manifest.files = manifest.files || {};
    manifest.files[role] = { ...prev, file: update.file, ...(update.loaderFlag ? { loaderFlag: update.loaderFlag } : {}) };
    delete manifest.files[role].name;
    manifest.updatedAt = now.toISOString();
    return manifest;
  }

  static _removeSuperseded(dir, update) {
    if (!update.replaces || update.replaces === update.file) return;
    try {
      fs.rmSync(path.join(dir, update.replaces), { force: true });
    } catch (err) {
      console.warn('[image-server] could not remove superseded file:', err && err.message);
    }
  }
}

module.exports = ModelFileUpdater;
