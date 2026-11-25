const fs = require('fs');
const path = require('path');
const ImageModelManifest = require('./ImageModelManifest');
const ImageSlots = require('./ImageSlots');

class Int8WeightsRemover {
  static NONE = 'This model has no faster weights to remove.';

  constructor(imageServerService) {
    this._svc = imageServerService;
    this._slots = new ImageSlots(imageServerService);
  }

  async remove(id) {
    const { dir, manifest } = this._target(id);
    await this._slots.stopHosting(id);
    fs.rmSync(path.join(dir, path.basename(manifest.files.diffusion.int8File)), { force: true });
    delete manifest.files.diffusion.int8File;
    ImageModelManifest.write(dir, manifest);
  }

  _target(id) {
    if (!id || typeof id !== 'string') throw new Error('id required');
    const dir = ImageModelManifest.modelDir(this._svc.getModelsDirConfig().effectivePath, id);
    if (!dir) throw new Error('invalid model id');
    if (!ImageModelManifest.exists(dir)) throw new Error(Int8WeightsRemover.NONE);
    const manifest = ImageModelManifest.read(dir);
    const diffusion = manifest.files && manifest.files.diffusion;
    if (!diffusion || !diffusion.int8File) throw new Error(Int8WeightsRemover.NONE);
    return { dir, manifest };
  }
}

module.exports = Int8WeightsRemover;
