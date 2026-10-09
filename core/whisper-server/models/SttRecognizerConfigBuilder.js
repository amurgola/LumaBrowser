const path = require('path');

class SttRecognizerConfigBuilder {
  static DEFAULT_THREADS = 4;

  static build(model, modelDir, numThreads) {
    const files = model.files || {};
    const threads = numThreads || SttRecognizerConfigBuilder.DEFAULT_THREADS;
    const inDir = (file) => path.join(modelDir, file);
    if (model.sherpaKind === 'nemo_transducer') return SttRecognizerConfigBuilder._nemoTransducer(files, inDir, threads);
    if (model.sherpaKind === 'qwen3_asr') return SttRecognizerConfigBuilder._qwen3Asr(files, inDir, threads);
    throw new Error(`Unknown sherpa STT model kind: ${model.sherpaKind}`);
  }

  static _nemoTransducer(files, inDir, threads) {
    return {
      featConfig: { sampleRate: 16000, featureDim: 80 },
      modelConfig: {
        transducer: {
          encoder: inDir(files.encoder || 'encoder.int8.onnx'),
          decoder: inDir(files.decoder || 'decoder.int8.onnx'),
          joiner: inDir(files.joiner || 'joiner.int8.onnx'),
        },
        tokens: inDir(files.tokens || 'tokens.txt'),
        ...SttRecognizerConfigBuilder._cpuRuntime(threads),
        modelType: 'nemo_transducer',
      },
    };
  }

  static _qwen3Asr(files, inDir, threads) {
    return {
      modelConfig: {
        qwen3Asr: {
          convFrontend: inDir(files.convFrontend || 'conv_frontend.onnx'),
          encoder: inDir(files.encoder || 'encoder.int8.onnx'),
          decoder: inDir(files.decoder || 'decoder.int8.onnx'),
          tokenizer: inDir(files.tokenizerDir || 'tokenizer'),
        },
        tokens: '',
        ...SttRecognizerConfigBuilder._cpuRuntime(threads),
      },
    };
  }

  static _cpuRuntime(threads) {
    return { numThreads: threads, provider: 'cpu', debug: 0 };
  }
}

module.exports = SttRecognizerConfigBuilder;
