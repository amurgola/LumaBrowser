const ModelFamilies = require('../ModelFamilies');

class ModelFiles {
  constructor(model) {
    this.name = model.name;
    this.modelPath = model.weights[0].path;
    this.modelBytes = Number(model.weightsTotalBytes) || 0;
    this.mmprojPath = ModelFiles._firstPath(model.mmproj);
    this.mmprojBytes = Number(model.mmprojTotalBytes) || 0;
    this.drafterPath = ModelFiles._firstPath(model.drafter);
    this.drafterBytes = Number(model.drafterTotalBytes) || 0;
    this._readMtpHead(model);
    this.mtpCapable = !!model.mtpCapable;
    this.gguf = ModelFiles._parsedHeader(model);
    this.rawGguf = model.gguf || null;
    this.family = ModelFamilies.detect(model);
  }

  _readMtpHead(model) {
    this.mtpGrafted = model.mtpGrafted === true;
    this.mtpHeadOnDisk = ModelFiles._firstPath(model.mtp);
    this.mtpHeadPath = this.mtpGrafted ? null : this.mtpHeadOnDisk;
    this.mtpHeadBytes = this.mtpHeadPath ? (Number(model.mtpTotalBytes) || 0) : 0;
  }

  static _parsedHeader(model) {
    return model.gguf && model.gguf.parsed && model.gguf.blockCount > 0 ? model.gguf : null;
  }

  static _firstPath(files) {
    return files && files.length > 0 ? files[0].path : null;
  }
}

module.exports = ModelFiles;
