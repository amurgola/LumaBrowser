const path = require('path');

class TtsModelConfigBuilder {
  static DEFAULT_THREADS = 4;

  static POCKET_MAX_THREADS = 6;

  static POCKET_VOICE_CACHE = 16;

  static DEFAULT_KOKORO_LEXICONS = ['lexicon-us-en.txt', 'lexicon-zh.txt'];

  static build(entry, modelDir, numThreads) {
    const inDir = (...parts) => path.join(modelDir, ...parts);
    if (entry.engine === 'kokoro') return TtsModelConfigBuilder._kokoro(entry, inDir, numThreads);
    if (entry.engine === 'pocket') return TtsModelConfigBuilder._pocket(entry, inDir, numThreads);
    if (entry.engine === 'vits') return TtsModelConfigBuilder._vits(entry, modelDir, inDir, numThreads);
    throw new Error(`Unknown TTS engine: ${entry.engine}`);
  }

  static _kokoro(entry, inDir, numThreads) {
    const hasDict = entry.hasDict !== undefined ? !!entry.hasDict : true;
    const lexicons = entry.lexiconFiles !== undefined ? entry.lexiconFiles : TtsModelConfigBuilder.DEFAULT_KOKORO_LEXICONS;
    return TtsModelConfigBuilder._wrap({
      kokoro: {
        model: inDir(entry.onnxFile || 'model.int8.onnx'),
        voices: inDir('voices.bin'),
        tokens: inDir('tokens.txt'),
        dataDir: inDir('espeak-ng-data'),
        dictDir: hasDict ? inDir('dict') : '',
        lexicon: (lexicons || []).map((file) => inDir(file)).join(','),
      },
    }, numThreads || TtsModelConfigBuilder.DEFAULT_THREADS);
  }

  static _pocket(entry, inDir, numThreads) {
    const files = entry.pocketFiles || {};
    const threads = Math.min(numThreads || TtsModelConfigBuilder.DEFAULT_THREADS, TtsModelConfigBuilder.POCKET_MAX_THREADS);
    return TtsModelConfigBuilder._wrap({
      pocket: {
        lmMain: inDir(files.lmMain || 'lm_main.int8.onnx'),
        lmFlow: inDir(files.lmFlow || 'lm_flow.int8.onnx'),
        encoder: inDir(files.encoder || 'encoder.onnx'),
        decoder: inDir(files.decoder || 'decoder.int8.onnx'),
        textConditioner: inDir(files.textConditioner || 'text_conditioner.onnx'),
        vocabJson: inDir('vocab.json'),
        tokenScoresJson: inDir('token_scores.json'),
        voiceEmbeddingCacheCapacity: TtsModelConfigBuilder.POCKET_VOICE_CACHE,
      },
    }, threads);
  }

  static _vits(entry, modelDir, inDir, numThreads) {
    const onnx = entry.onnxFile || `${path.basename(modelDir).replace(/^vits-piper-/, '')}.onnx`;
    return TtsModelConfigBuilder._wrap({
      vits: {
        model: inDir(onnx),
        tokens: inDir('tokens.txt'),
        dataDir: inDir('espeak-ng-data'),
      },
    }, numThreads || TtsModelConfigBuilder.DEFAULT_THREADS);
  }

  static _wrap(engineConfig, numThreads) {
    return {
      model: { ...engineConfig, numThreads, provider: 'cpu', debug: 0 },
      maxNumSentences: 1,
    };
  }
}

module.exports = TtsModelConfigBuilder;
