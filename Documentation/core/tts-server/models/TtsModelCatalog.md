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
  `KITTEN_DEFAULT_SID` (6), `KITTEN_SPEED_SCALE` (1.25), `RELEASE_BASE_URL`, `KYUTAI_VOICES_BASE_URL`,
  `KOKORO_MIN_THREADS`, `KOKORO_RECOMMENDED_ID`, `POCKET_RECOMMENDED_ID`.

## Entry shape

`{ id, name, description, archive, sizeBytes, engine: 'pocket'|'kokoro'|'vits'|'kitten',
license, defaultSid, speedScale?, recommendedFor?, quality: 'light'|'low'|'fast'|'medium'|'high', voices? }`.
Each archive extracts to `<modelsDir>/tts/<id>/` with everything the engine needs.

## Why

- All archives are hosted by sherpa-onnx (k2-fsa) on the `tts-models` tag; names
  verified 2026-08-02 (v0_19 added 2026-08-03, KittenTTS Nano 2026-10-22).
- Licensing: Kokoro and KittenTTS weights Apache-2.0; Piper LibriTTS-R voice
  data CC BY 4.0. Deliberately not offered: lessac/ljspeech Piper voices
  (restrictive dataset licenses) and RAIL-licensed models (Supertonic).
- KittenTTS (KittenML): the sherpa archive `kitten-nano-en-v0_8-fp32` (15M
  params, 61 MB) is the v0.8 ONNX release of github.com/KittenML/KittenTTS.
  Measured 2026-10-22 through sherpa-onnx 1.13.4 at 2 threads: fp32 RTF 0.07
  with a 0.35 s first chunk; the int8 build (31 MB) was slower (RTF 0.15, 0.6 to
  0.8 s first chunk) and the one a user reported as tinny, so fp32 ships. Kitten
  speed was flat from 2 to 12 threads. The 80M `kitten-mini-en-v0_8` (68 MB)
  was RTF 0.4 with a 1.4 to 2.0 s first chunk at 2 threads, so only Nano is
  offered. Eight English speakers in sherpa's `voices.bin` order
  (`expr-voice-2-m`, `2-f`, `3-m`, `3-f`, `4-m`, `4-f`, `5-m`, `5-f`);
  `defaultSid` 6 is `expr-voice-5-m`, the upstream default, and the service uses
  it until the user picks a speaker. The fp32 archive's graph is
  `model.fp32.onnx`. `speedScale: 1.25` (`KITTEN_SPEED_SCALE`) cancels the 0.8
  per-voice `speaker_speed_priors` that sherpa (like upstream) multiplies into
  every Nano request: measured 2026-10-22 on a 27-word sentence, speed 1 gave
  132 words a minute for speaker 6 and 179 for speaker 0 against Kokoro's 218;
  at 1.25 they read 166 and 214. The service applies the scale on top of the
  user's speed, so 1.0 stays conversational. The sherpa v0.8 archives need sherpa-onnx
  1.13.2 or newer (the pinned 1.13.8 qualifies). The Hugging Face
  `KittenML/kitten-tts-2` model is a different 1.7B GGUF speech LM (audio.cpp
  runs it; sherpa-onnx does not) under the Stellon Labs Community License, so it
  belongs to the Chatterbox add-on's voice cloning catalog, not here.
- `quality` drives the Light / Low / Fast / Medium / High picker. v0.19 outranks the newer
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
