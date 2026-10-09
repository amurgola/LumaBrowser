const path = require('path');
const ModelDirectoryScanner = require('../../media-shared/ModelDirectoryScanner');

class SherpaSttScanner extends ModelDirectoryScanner {
  _describeEntry(dir, entry) {
    if (!entry.isDirectory()) return null;
    const modelDir = path.join(dir, entry.name);
    const files = this._listFiles(modelDir);
    if (!files) return null;
    const onnx = ModelDirectoryScanner.onnxFilesIn(files);
    if (!onnx.length) return null;
    const detected = SherpaSttScanner._detectKind(files, onnx);
    if (!detected) return null;
    return {
      id: entry.name,
      name: entry.name,
      dir: modelDir,
      path: modelDir,
      engine: 'sherpa',
      sherpaKind: detected.sherpaKind,
      files: detected.files,
      sizeBytes: this._sumFileSizes(modelDir, onnx),
    };
  }

  static _detectKind(files, onnx) {
    const convFrontend = SherpaSttScanner._pickGraph(onnx, /^conv_frontend.*\.onnx$/i);
    const encoder = SherpaSttScanner._pickGraph(onnx, /^encoder.*\.onnx$/i);
    const decoder = SherpaSttScanner._pickGraph(onnx, /^decoder.*\.onnx$/i);
    const joiner = SherpaSttScanner._pickGraph(onnx, /^joiner.*\.onnx$/i);
    if (convFrontend && encoder && decoder && files.includes('tokenizer')) {
      return { sherpaKind: 'qwen3_asr', files: { convFrontend, encoder, decoder, tokenizerDir: 'tokenizer' } };
    }
    if (encoder && decoder && joiner && files.includes('tokens.txt')) {
      return { sherpaKind: 'nemo_transducer', files: { encoder, decoder, joiner, tokens: 'tokens.txt' } };
    }
    return null;
  }

  static _pickGraph(onnx, pattern) {
    const matches = onnx.filter((file) => pattern.test(file));
    matches.sort((a, b) => /int8/i.test(b) - /int8/i.test(a));
    return matches[0] || null;
  }
}

module.exports = SherpaSttScanner;
