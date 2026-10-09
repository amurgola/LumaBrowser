# TtsModelCatalog

`core/tts-server/models/TtsModelCatalog.js`

The curated text-to-speech voice models for voice mode, plus the curated Pocket
TTS reference clips and the host-size recommendation. Extends `MediaModelCatalog`.

## Methods

- `new TtsModelCatalog()` wraps `TtsModelCatalog.ENTRIES`.
- `list()`, `getById(id)`, `fingerprint()` (inherited).
- `downloadUrl(entry)` returns the sherpa `tts-models` release URL for `entry.archive`.
- `recommendedId(numThreads)` returns `kokoro-int8-multi-lang-v1_1` at 8 or
  more threads, else `pocket-tts-int8`.
- `pocketVoiceUrl(voice)` returns the kyutai/tts-voices HF URL for `voice.source`.
- Statics: `ENTRIES`, `POCKET_VOICE_SET`, `POCKET_NUM_STEPS` (2),
  `RELEASE_BASE_URL`, `KYUTAI_VOICES_BASE_URL`, `KOKORO_MIN_THREADS`,
  `KOKORO_RECOMMENDED_ID`, `POCKET_RECOMMENDED_ID`.

## Entry shape

`{ id, name, description, archive, sizeBytes, engine: 'pocket'|'kokoro'|'vits',
license, defaultSid, recommendedFor?, quality: 'fast'|'medium'|'high'|'low', voices? }`.
Each archive extracts to `<modelsDir>/tts/<id>/` with everything the engine needs.

## Why

- All archives are hosted by sherpa-onnx (k2-fsa) on the `tts-models` tag; names
  verified 2026-08-02 (v0_19 added 2026-08-03).
- Licensing: Kokoro weights Apache-2.0; Piper LibriTTS-R voice data CC BY 4.0.
  Deliberately not offered: lessac/ljspeech Piper voices (restrictive dataset
  licenses) and RAIL-licensed models (Supertonic).
- `quality` drives the Low / Medium / High picker. v0.19 outranks the newer
  multi-lang v1.1 for English because sherpa phonemizes English with espeak-ng,
  which v0.19 was trained on; v1.x was trained on Misaki G2P (see
  `KokoroTokenPatcher` for the worst mismatch).
- Pocket TTS (Kyutai, 100M) has no voice table: every utterance is conditioned
  on a short reference WAV. The archive ships only unlicensed test clips, so the
  service fetches `POCKET_VOICE_SET` into `<modelDir>/voices/` after download.
  All five are CC0 or CC-BY-4.0 from Kyutai's tts-voices repo (never the
  NonCommercial expresso/ears folders), sorted by file name because the index is
  the speaker id (sid 0 is alba).
- `POCKET_NUM_STEPS = 2`: measured 2026-10-03 at 12 threads, 5 flow-matching
  steps gave a 1.0 to 1.5 s first chunk, 2 steps 0.65 to 1.0 s with no audible loss.
- Recommendation: Kokoro (RTF about 0.6 at 12 threads, 0.76 at 4) only stays
  comfortably ahead of realtime on a beefy CPU; Pocket measured RTF about 0.4 at
  4 threads with a 0.6 s first chunk, so smaller hosts get it by default.

The v0.19 description's em-dash was replaced with a colon during the port
(user-facing text rule).
