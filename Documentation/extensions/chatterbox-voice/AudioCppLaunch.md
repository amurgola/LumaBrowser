# AudioCppLaunch

`extensions/chatterbox-voice/AudioCppLaunch.js`

Builds the audiocpp_server launch.

## Methods

- `AudioCppLaunch.resolve({ runtimesRoot, modelsDir, voices = [], preferredRuntimeId = null, threads = null })`
  resolves `{ binaryPath, args: ['--config', <path>, '--no-ui'], plan: { port,
  runtimeId, backend, models, voices }, healthTimeoutMs: 60000 }`.
  - No installed build throws `code: 'TTS_RUNTIME_MISSING'`, `installable: true`.
  - Every downloaded model is registered (`task` `clon` for the cloner, `tts`
    for Turbo, `mode: 'offline'`, forward-slash paths); none throws `NO_TTS_MODEL`.
  - Cloned voices become `voice_presets` on the cloner (`voice_ref`, optional `reference_text`).
  - Writes `<runtimesRoot>/<build>/luma-server.json` with host 127.0.0.1, the
    port (first free in `PORT_RANGE` 8220-8239), backend, threads (given, else
    half the cores clamped to 2..8), `lazy_load`, `max_loaded_models: 2`,
    `idle_unload_ms: 0`.
- Statics: `PORT_RANGE`, `CONFIG_FILE`, `HEALTH_TIMEOUT_MS`.

## Why

The config is generated per launch so the presets always mirror the store.
Models load lazily, so an unused one costs nothing and health is quick; both
stay resident so switching between Turbo and the cloner does not reload 2 GB.
The port window sits just above core's last window (grounding 8200-8219) and is
not in core's `FreePort.PORT_WINDOWS` table.
