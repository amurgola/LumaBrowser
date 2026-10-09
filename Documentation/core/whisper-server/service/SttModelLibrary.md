# SttModelLibrary

`core/whisper-server/service/SttModelLibrary.js`

Every installed speech-to-text model across both engines, and the one a launch
would use.

## Methods

- `new SttModelLibrary({ sherpaModelsDir, whisperModelsDir, sherpaScanner?, whisperScanner? })`;
  the dirs are functions read live, the scanners default to
  [SherpaSttScanner](../sherpa/SherpaSttScanner.md) and
  [WhisperModelsScanner](../WhisperModelsScanner.md).
- `list()` sherpa descriptors first, then whisper files with `engine: 'whisper'`
  added. Each has `path` (the file or the dir), which the default setting stores.
- `resolve(chosenPath, models = list())` the model whose resolved path matches
  `chosenPath` case-insensitively, else the first model, else `null`.

## Why

Sherpa is listed first because it is the recommended engine, so it wins the
"nothing chosen" fallback. The case-insensitive match keeps a Windows path saved
with a different drive-letter case working.
