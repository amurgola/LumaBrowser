# SherpaAddon

`core/tts-server/runtimes/SherpaAddon.js`

Loads the user-installed sherpa-onnx Node addon inside a voice worker and builds
its engines. Shared by the TTS and STT workers.

## Methods

- `SherpaAddon.load(addonDir)` requires `<addonDir>/sherpa-onnx.js` (the wrapper
  `SherpaRuntimeLayout.addonDir` points at).
- `SherpaAddon.create(EngineClass, config)` resolves
  `EngineClass.createAsync(config)` when the build offers it, else `new EngineClass(config)`.
- `SherpaAddon.errorMessage(err)` is `err.message` or `String(err)`.
- `SherpaAddon.ENTRY_FILE` is `'sherpa-onnx.js'`.

## Why

`createAsync` loads the model off the JS thread (about 9 s for Kokoro, 15 s for
Qwen3-ASR), so the worker keeps answering messages while it loads. Both workers
had the same load-and-create code; one copy keeps them identical. Workers load
this file as plain JS (see [TtsWorker.md](../TtsWorker.md)).
