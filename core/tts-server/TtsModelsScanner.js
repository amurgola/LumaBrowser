const path = require('path');
const ModelDirectoryScanner = require('../media-shared/ModelDirectoryScanner');

class TtsModelsScanner extends ModelDirectoryScanner {
  static VOICE_DIRS = ['voices', 'test_wavs'];

  static POCKET_GRAPHS = {
    lmMain: /^lm_main.*\.onnx$/i,
    lmFlow: /^lm_flow.*\.onnx$/i,
    encoder: /^encoder.*\.onnx$/i,
    decoder: /^decoder.*\.onnx$/i,
    textConditioner: /^text_conditioner.*\.onnx$/i,
  };

  _describeEntry(dir, entry) {
    if (!entry.isDirectory()) return null;
    const modelDir = path.join(dir, entry.name);
    const files = this._listFiles(modelDir);
    if (!files) return null;
    const onnx = ModelDirectoryScanner.onnxFilesIn(files);
    if (!onnx.length) return null;
    const engine = TtsModelsScanner._detectEngine(files, onnx);
    if (!engine) return null;
    const base = { id: entry.name, name: entry.name, dir: modelDir, engine };
    const sizeBytes = this._sumFileSizes(modelDir, onnx);
    if (engine === 'pocket') return { ...base, ...this._describePocket(modelDir, onnx), sizeBytes };
    return { ...base, ...TtsModelsScanner._describeOnnxVoice(engine, files, onnx), sizeBytes };
  }

  scanPocketVoices(modelDir) {
    for (const sub of TtsModelsScanner.VOICE_DIRS) {
      const voicesDir = path.join(modelDir, sub);
      const clips = (this._listFiles(voicesDir) || []).filter((file) => /\.wav$/i.test(file)).sort();
      if (clips.length) return clips.map((file) => TtsModelsScanner._describeClip(voicesDir, file));
    }
    return [];
  }

  static _detectEngine(files, onnx) {
    if (TtsModelsScanner._pick(onnx, TtsModelsScanner.POCKET_GRAPHS.lmMain)) return 'pocket';
    if (files.includes('voices.bin')) return 'kokoro';
    if (files.includes('tokens.txt')) return 'vits';
    return null;
  }

  _describePocket(modelDir, onnx) {
    const pocketFiles = {};
    for (const [role, pattern] of Object.entries(TtsModelsScanner.POCKET_GRAPHS)) {
      pocketFiles[role] = TtsModelsScanner._pick(onnx, pattern);
    }
    return { onnxFile: pocketFiles.lmMain, pocketFiles, voices: this.scanPocketVoices(modelDir) };
  }

  static _describeOnnxVoice(engine, files, onnx) {
    const onnxFile = engine === 'kokoro' ? (onnx.find((file) => /int8/i.test(file)) || onnx[0]) : onnx[0];
    return {
      onnxFile,
      hasDict: files.includes('dict'),
      lexiconFiles: files.filter((file) => /^lexicon-.*\.txt$/i.test(file)).sort(),
    };
  }

  static _describeClip(voicesDir, file) {
    const id = file.replace(/\.wav$/i, '');
    const name = id.charAt(0).toUpperCase() + id.slice(1).replace(/[_-]+/g, ' ');
    return { id, name, path: path.join(voicesDir, file) };
  }

  static _pick(onnx, pattern) {
    return onnx.find((file) => pattern.test(file)) || null;
  }
}

module.exports = TtsModelsScanner;
