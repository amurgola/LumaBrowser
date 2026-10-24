const fs = require('fs');
const path = require('path');
const ModelDirectoryScanner = require('../media-shared/ModelDirectoryScanner');

class TtsModelsScanner extends ModelDirectoryScanner {
  static VOICE_DIRS = ['voices', 'test_wavs'];

  static METADATA_TAIL_BYTES = 16 * 1024;
  static KITTEN_MODEL_TYPE = /model_type[\s\S]{2}kitten-tts/;

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
    const engine = this._detectEngine(modelDir, entry.name, files, onnx);
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

  _detectEngine(modelDir, name, files, onnx) {
    if (TtsModelsScanner._pick(onnx, TtsModelsScanner.POCKET_GRAPHS.lmMain)) return 'pocket';
    if (files.includes('voices.bin')) return this._isKitten(modelDir, name, onnx) ? 'kitten' : 'kokoro';
    if (files.includes('tokens.txt')) return 'vits';
    return null;
  }

  _isKitten(modelDir, name, onnx) {
    if (/^kitten-/i.test(name)) return true;
    const tail = this._readTail(path.join(modelDir, TtsModelsScanner._voiceGraph(onnx)), TtsModelsScanner.METADATA_TAIL_BYTES);
    return TtsModelsScanner.KITTEN_MODEL_TYPE.test(tail);
  }

  _readTail(filePath, bytes) {
    let fd = null;
    try {
      fd = fs.openSync(filePath, 'r');
      const size = fs.fstatSync(fd).size;
      const length = Math.min(size, bytes);
      const buffer = Buffer.alloc(length);
      fs.readSync(fd, buffer, 0, length, size - length);
      return buffer.toString('latin1');
    } catch (_) {
      return '';
    } finally {
      if (fd !== null) fs.closeSync(fd);
    }
  }

  _describePocket(modelDir, onnx) {
    const pocketFiles = {};
    for (const [role, pattern] of Object.entries(TtsModelsScanner.POCKET_GRAPHS)) {
      pocketFiles[role] = TtsModelsScanner._pick(onnx, pattern);
    }
    return { onnxFile: pocketFiles.lmMain, pocketFiles, voices: this.scanPocketVoices(modelDir) };
  }

  static _describeOnnxVoice(engine, files, onnx) {
    const onnxFile = engine === 'vits' ? onnx[0] : TtsModelsScanner._voiceGraph(onnx);
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

  static _voiceGraph(onnx) {
    return onnx.find((file) => /int8/i.test(file)) || onnx[0];
  }
}

module.exports = TtsModelsScanner;
