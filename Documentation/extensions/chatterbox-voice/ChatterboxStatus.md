# ChatterboxStatus

`extensions/chatterbox-voice/ChatterboxStatus.js`

The snapshot the "Voice cloning" tab polls.

## Methods

- `ChatterboxStatus.build({ voice, extensionId, engine, store, settings, jobs, runtimesDir, modelsDir })`
  resolves `{ runtimes, sttReady, activeRuntime, preferredRuntimeId, models,
  voices, turboAvailable, kitten, cloneModelId, cloneModels, attributions,
  activeVoiceId, languages, limits, server, jobs }`:
  - `runtimes`: every catalog row with `available` (asset for this host),
    `installed`, `recommended` (first available);
  - `sttReady`: awaited `context.voice.sttReady()`, false when absent;
  - `activeRuntime`: `{ id, backend, release: { tag, publishedAt } | null }`;
  - `models`: rows with `tasks`, `licenseNote`, `attribution`, `installed`,
    `bytesOnDisk`, `runtimeSupported` and `runtimeNote` (set when the installed
    audio.cpp predates the model);
  - `kitten`: `{ available, installed, runtimeSupported, preset, groups, attribution }`
    for the KittenTTS 2 built-in voice (`groups` feeds the picker);
  - `cloneModelId`: the engine's effective cloner; `cloneModels`: the installed,
    supported models that clone (`{ id, name }`);
  - `attributions`: lines the licenses of downloaded models oblige the product
    to show (`Powered by KittenML`);
  - `voices`: stored rows plus `languageName`;
  - `activeVoiceId`: the default TTS model id minus `ext:<extensionId>:`, else null;
  - `limits`: `{ minRefSec, maxRefSec }`; `server`: the engine status;
  - `jobs`: copies of the runtime and model job states, or null.

## Why

`context.voice.sttReady()` is async in the rebuild because
`WhisperServerService.getView()` is async. Legacy read it synchronously, so in
the rebuild it would always have been a pending Promise; the snapshot awaits it.
