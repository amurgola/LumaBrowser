# TtsModelConfigBuilder

`core/tts-server/models/TtsModelConfigBuilder.js`

Builds the exact `OfflineTts` config the sherpa-onnx-node addon expects for a
catalog entry or a scanned model descriptor.

## Methods

- `TtsModelConfigBuilder.build(entry, modelDir, numThreads)` returns
  `{ model: { <engine>: {...}, numThreads, provider: 'cpu', debug: 0 }, maxNumSentences: 1 }`.
  Throws `Unknown TTS engine: <engine>` otherwise.
  - `kokoro`: `model` (`entry.onnxFile` or `model.int8.onnx`), `voices.bin`,
    `tokens.txt`, `espeak-ng-data`, `dictDir` (`dict` or `''` when
    `entry.hasDict === false`), `lexicon` (comma-joined `entry.lexiconFiles`, or
    the v1.x default `lexicon-us-en.txt,lexicon-zh.txt` when not scanned).
  - `pocket`: the five graphs from `entry.pocketFiles` (int8 archive names as
    fallback), `vocab.json`, `token_scores.json`,
    `voiceEmbeddingCacheCapacity: 16`; threads capped at 6.
  - `vits`: `entry.onnxFile`, or the folder name minus `vits-piper-` plus `.onnx`;
    `tokens.txt`, `espeak-ng-data`.
- Threads default to 4.
- Statics: `DEFAULT_THREADS`, `POCKET_MAX_THREADS`, `POCKET_VOICE_CACHE`,
  `DEFAULT_KOKORO_LEXICONS`.

## Why

- Kept out of the worker so the worker stays a dumb executor and the shape is
  unit-testable without the native addon.
- Kokoro's layout varies by release: v1.x carries `dict/` and lexicon files,
  v0.19 is espeak-only. The scanner reports what is really there so sherpa is
  never pointed at missing paths; bare entries assume v1.x.
- Pocket carries its own BPE vocab and token scores, so no tokens or espeak
  data. It is a small model whose speed is flat from 4 to 12 threads, so it
  leaves cores to the LLM. The voice cache holds one embedding per bundled voice
  plus room for extension-fed clips.
- Piper archives name the onnx after the voice, which the scanner detects; the
  folder-name guess covers an un-scanned entry.
