const fs = require('fs');
const path = require('path');

class GroundingModelFiles {
  static MMPROJ = /mmproj/i;
  static GGUF = /\.gguf$/i;
  static QUANTIZED = /q\d/i;

  static pairMmproj(modelPath) {
    try {
      const dir = path.dirname(modelPath);
      const hits = fs.readdirSync(dir).filter(GroundingModelFiles._isProjector);
      if (!hits.length) return null;
      hits.sort((a, b) => Number(GroundingModelFiles.QUANTIZED.test(a)) - Number(GroundingModelFiles.QUANTIZED.test(b)));
      return path.join(dir, hits[0]);
    } catch (_) {
      return null;
    }
  }

  static sizeOf(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (_) {
      return 0;
    }
  }

  static exists(filePath) {
    return !!filePath && fs.existsSync(filePath);
  }

  static modelName(modelPath) {
    return path.basename(modelPath, path.extname(modelPath));
  }

  static _isProjector(name) {
    return GroundingModelFiles.MMPROJ.test(name) && GroundingModelFiles.GGUF.test(name) && !name.endsWith('.partial');
  }
}

module.exports = GroundingModelFiles;
