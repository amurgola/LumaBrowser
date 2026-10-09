# TtsModelsScanner

`core/tts-server/TtsModelsScanner.js`

Finds extracted text-to-speech archives under `<appBaseDir>/models/tts` (one
folder per voice model) and detects the engine from the files. Extends
`ModelDirectoryScanner`.

## Methods

- `new TtsModelsScanner().scan(dir)` returns descriptors sorted by id:
  - Pocket: `{ id, name, dir, engine: 'pocket', onnxFile, pocketFiles: { lmMain, lmFlow, encoder, decoder, textConditioner }, voices, sizeBytes }`
  - Kokoro / VITS: `{ id, name, dir, engine, onnxFile, hasDict, lexiconFiles, sizeBytes }`
  `sizeBytes` sums the `.onnx` graphs. Folders with no `.onnx` are skipped.
- `scanPocketVoices(modelDir)` returns `[{ id, name, path }]` for the WAVs in
  `voices/`, else `test_wavs/`, else `[]`. Sorted by file name (index = speaker
  id); `name` capitalises the id and turns `_` / `-` runs into spaces.
- Statics: `VOICE_DIRS`, `POCKET_GRAPHS`.

## Detection

Checked in this order, because a Pocket archive also ships `tokens.txt`:

- `pocket`: an `lm_main*.onnx` graph.
- `kokoro`: `voices.bin`. `onnxFile` prefers the `int8` graph (int8 archives
  carry `model.int8.onnx`, fp32 ones `model.onnx`).
- `vits` (Piper): `tokens.txt`; `onnxFile` is the first `.onnx`.

`hasDict` and `lexiconFiles` report what a Kokoro folder really contains (v1.x
carries `dict/` and lexicons, v0.19 is espeak-only) so `TtsModelConfigBuilder`
never points sherpa at missing paths.

## Why

`voices/` holds the curated, licensed clip set fetched after download;
`test_wavs/` is the archive's own samples, kept as a fallback so a
half-provisioned Pocket model still speaks. A Pocket model with no clips at all
is still listed; the worker reports the missing voice.
