# SherpaSttScanner

`core/whisper-server/sherpa/SherpaSttScanner.js`

Finds extracted sherpa-onnx speech-to-text archives under
`<appBaseDir>/models/stt` (one folder per model) and detects their kind.
Extends `ModelDirectoryScanner`.

## Methods

- `new SherpaSttScanner().scan(dir)` returns, sorted by id,
  `[{ id, name, dir, path, engine: 'sherpa', sherpaKind, files, sizeBytes }]`.
  `path` equals `dir` because the default-model setting stores `path`.
  `sizeBytes` sums the `.onnx` graphs only.

## Detection

Structural, checked in this order:

- `qwen3_asr`: `conv_frontend*.onnx` + `encoder*` + `decoder*` + a `tokenizer`
  entry. `files = { convFrontend, encoder, decoder, tokenizerDir: 'tokenizer' }`.
- `nemo_transducer` (NVIDIA Parakeet TDT): `encoder*` + `decoder*` + `joiner*`
  + `tokens.txt`. `files = { encoder, decoder, joiner, tokens: 'tokens.txt' }`.

Anything else (a half-extracted folder, a TTS model dropped here) is not
offered. When an archive carries both precisions of a graph, the `int8` one wins.
