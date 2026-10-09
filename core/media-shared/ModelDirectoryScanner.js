const fs = require('fs');
const path = require('path');

class ModelDirectoryScanner {
  scan(dir) {
    const entries = this._readEntries(dir);
    const models = [];
    for (const entry of entries) {
      const model = this._describeEntry(dir, entry);
      if (model) models.push(model);
    }
    return models.sort((a, b) => this._sortKey(a).localeCompare(this._sortKey(b)));
  }

  _describeEntry() {
    throw new Error(`${this.constructor.name} must implement _describeEntry(dir, dirent)`);
  }

  _sortKey(model) {
    return model.id;
  }

  _readEntries(dir) {
    try {
      return fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      return [];
    }
  }

  _listFiles(modelDir) {
    try {
      return fs.readdirSync(modelDir);
    } catch (_) {
      return null;
    }
  }

  _fileSize(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (_) {
      return null;
    }
  }

  _sumFileSizes(modelDir, files) {
    let total = 0;
    for (const file of files) total += this._fileSize(path.join(modelDir, file)) || 0;
    return total;
  }

  static onnxFilesIn(files) {
    return files.filter((file) => /\.onnx$/i.test(file));
  }
}

module.exports = ModelDirectoryScanner;
