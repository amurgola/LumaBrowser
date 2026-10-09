const path = require('path');
const ModelDirectoryScanner = require('../media-shared/ModelDirectoryScanner');

class WhisperModelsScanner extends ModelDirectoryScanner {
  static MIN_MODEL_BYTES = 10 * 1024 * 1024;

  _describeEntry(dir, entry) {
    if (!entry.isFile() || !WhisperModelsScanner._isModelFileName(entry.name)) return null;
    const fullPath = path.join(dir, entry.name);
    const sizeBytes = this._fileSize(fullPath);
    if (sizeBytes == null || sizeBytes < WhisperModelsScanner.MIN_MODEL_BYTES) return null;
    return {
      id: entry.name.replace(/\.bin$/i, ''),
      name: entry.name,
      path: fullPath,
      sizeBytes,
    };
  }

  _sortKey(model) {
    return model.name;
  }

  static _isModelFileName(name) {
    return /\.bin$/i.test(name) && !/\.partial$/i.test(name);
  }
}

module.exports = WhisperModelsScanner;
