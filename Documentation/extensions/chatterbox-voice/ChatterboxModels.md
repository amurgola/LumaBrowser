# ChatterboxModels

`extensions/chatterbox-voice/ChatterboxModels.js`

The GGUF voice models the add-on can download (hosted by audio.cpp on Hugging
Face) and the language names the Setup tab shows.

## Methods

- `ChatterboxModels.getModels()` returns `MODELS`:
  - `chatterbox` (`tasks: ['clone']`, `serverTask: 'clon'`, 0.5B,
    `chatterbox-q8_0.gguf`, 2088393668 bytes, 19 language codes, MIT): zero-shot
    cloning from a reference clip;
  - `chatterbox-turbo` (`tasks: ['tts']`, `serverTask: 'tts'`, 350M,
    `chatterbox-turbo-q8_0.gguf`, 699101408 bytes, English, MIT): one built-in
    voice, roughly twice as fast, no cloning in audio.cpp today;
  - `kitten-tts2` (`KITTEN_ID`; `tasks: ['tts', 'clone']`, `serverTask: 'tts'`,
    1.7B ternary, `kitten-tts2-20261021-q8_0.gguf`, 3343404128 bytes, 16
    language codes, Stellon Labs Community License): 123 built-in voices
    (`presets`, grouped in `KITTEN_VOICE_GROUPS`: 38 English, 9 language, 76
    character and scene voices; `defaultPreset` `Bruno`) and cloning from a clip
    plus its transcript. `acceptsSpeed: false`, `minRuntimePublishedAt`
    `2026-10-19T00:00:00Z`, `licenseNote` (the commercial terms) and
    `attribution` `Powered by KittenML`.
- `ChatterboxModels.getModelById(id)` returns the row or `null`.
- `canClone(m)`, `hasPresets(m)`, `acceptsSpeed(id)` (unknown ids: true),
  `runtimeSupports(m, release)` (true without a requirement or with an unknown
  release; else `release.publishedAt >= m.minRuntimePublishedAt`),
  `runtimeNote(m)`, `presetFor(m, stored)` (the stored name when it is one of
  the presets, else the default; null for models without presets).
- Statics: `HF_BASE` (audio-cpp/audio.cpp-gguf), `MODELS`, `LANGUAGE_NAMES`
  (23 codes), `KITTEN_ID`, `KITTEN_DEFAULT_PRESET`, `KITTEN_VOICE_GROUPS`,
  `KITTEN_PRESETS`, `CLONE_PREFERENCE` (`['chatterbox', 'kitten-tts2']`).

All are single files, so the core resumable model downloader is reused as is.
Sizes were verified 2026-10-03 (Chatterbox) and 2026-10-22 (KittenTTS 2) via
the Hugging Face API.

## Why

- KittenTTS 2 registers under the audio.cpp `tts` task although it clones:
  measured 2026-10-22 against audio.cpp v0.9.2-drama3-base-small, one `tts`
  session serves both the prepared voices (request `voice`) and a per-request
  `voice_ref`, while a `clon` session answers "Kitten voice cloning requires
  reference audio" for the prepared voices. The transcript (`reference_text`)
  is mandatory for its cloning, and `speed` is refused ("speed is not supported
  by this model"), hence `acceptsSpeed: false`.
- The refreshed 2026-10-21 GGUF loads in the audio.cpp release of 2026-10-19
  (git 5074956) and newer; v0.9.2 (2026-10-15) and older do not know the
  family's updated weights, so `minRuntimePublishedAt` gates the voice and the
  Setup tab asks for a reinstall. Release dates are compared because the tags
  are not plain semver (`v0.9.2-drama3-base-small`).
- The 2026-10-22 weights on Hugging Face `KittenML/kitten-tts-2` are the
  source; the hosted GGUF embeds the S3 decoder, the speaker encoders and the
  123 prepared voices, so no companion files are needed. Q8 is the precision
  audio.cpp recommends; Q4 (2.6 GB) exists but was not offered.
- License (decided 2026-10-22 with the user): the Stellon Labs Community
  License allows personal use and commercial use under 1 million USD in annual
  revenue and total funding, requires registering with Stellon Labs for
  commercial use, keeping the notice and showing "Powered by KittenML", and
  forbids training other models on the model or its output. The terms sit in
  `licenseNote`, shown under the model's download row and in the manifest
  description; `attribution` is shown by the Setup tab and in the voice's
  description while the model is downloaded.
