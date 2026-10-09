# SttModelCatalog

`core/whisper-server/models/SttModelCatalog.js`

The curated speech-to-text models voice mode can download. Extends
`MediaModelCatalog`.

## Methods

- `new SttModelCatalog()` wraps `SttModelCatalog.ENTRIES`.
- `list()`, `getById(id)`, `fingerprint()` (inherited).
- `downloadUrl(entry)` returns the sherpa `asr-models` release URL for
  `engine: 'sherpa'` (`entry.archive`), else the ggerganov whisper.cpp HF URL
  (`entry.file`).
- `recommendedId()` returns `'parakeet-tdt-0.6b-v3'`, what one-click setup
  installs when nothing is present.
- Statics: `WHISPER_BASE_URL`, `SHERPA_ASR_BASE_URL`, `RECOMMENDED_ID`, `ENTRIES`.

## Entry shape

`{ id, engine: 'sherpa'|'whisper', name, description, sizeBytes, languages,
license, recommendedFor }` plus `sherpaKind` + `archive` for sherpa entries or
`file` for whisper entries.

## Why

Two engines: sherpa archives run in-process in the same sherpa-onnx addon the
TTS half installs (no second runtime download) and extract to
`<modelsDir>/stt/<id>/`; whisper ggml `.bin` files run in whisper.cpp's
whisper-server, kept for hosts that already have it and for its 99-language
coverage.

Parakeet became the default (2026-10-03): Open ASR Leaderboard 6.34% WER versus
whisper-large-v3-turbo's 7.75%, about 15x the throughput, measured here at about
240 ms for a 5 s utterance on CPU, well inside voice mode's 1.2 s partial
cadence. Qwen3-ASR covers 52 languages with the best open multilingual accuracy
at about 1.4 s per utterance. Archive names were verified against the sherpa
`asr-models` tag on 2026-10-03. Licenses are recorded in THIRD-PARTY-LICENSES.
