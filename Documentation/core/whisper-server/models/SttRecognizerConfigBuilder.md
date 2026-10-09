# SttRecognizerConfigBuilder

`core/whisper-server/models/SttRecognizerConfigBuilder.js`

Builds the sherpa-onnx `OfflineRecognizer` config for a scanned sherpa
speech-to-text model.

## Methods

- `SttRecognizerConfigBuilder.build(model, modelDir, numThreads)` takes a
  scanned descriptor (`{ sherpaKind, files }` from `SherpaSttScanner`) and
  returns the config. Threads default to 4; provider is always `cpu`, debug 0.
  - `nemo_transducer`: `featConfig { sampleRate: 16000, featureDim: 80 }`,
    `modelConfig.transducer { encoder, decoder, joiner }`, `tokens`,
    `modelType: 'nemo_transducer'`.
  - `qwen3_asr`: `modelConfig.qwen3Asr { convFrontend, encoder, decoder, tokenizer }`
    and `tokens: ''` (Qwen3 carries its own tokenizer directory); no `featConfig`.
  - Any other kind throws `Unknown sherpa STT model kind: <kind>`.
- Missing file names fall back to the int8 archive layout
  (`encoder.int8.onnx`, `tokens.txt`, `tokenizer`, ...).
- `SttRecognizerConfigBuilder.DEFAULT_THREADS` is 4.

## Why

Keeping the config here keeps the STT worker a dumb executor and makes the
config shape unit-testable without the native addon.
