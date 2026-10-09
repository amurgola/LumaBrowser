# ChatterboxExtension

`extensions/chatterbox-voice/ChatterboxExtension.js`

The active Chatterbox add-on.

## Methods

- `activate(context)` loads [ChatterboxSettings](ChatterboxSettings.md), opens
  the [VoiceStore](VoiceStore.md) at the models dir, builds the
  [ChatterboxEngine](ChatterboxEngine.md), registers it with
  `context.voice.registerTtsEngine` (throws `NO_VOICE_SURFACE` without it) and
  the Setup handler with `context.setupTab.onInvoke`, logs
  `Chatterbox Voice Cloning activated`, and resolves `{ engine, store, status }`.
- `deactivate()` stops the engine, cancels a running model download and drops all state.
- `handleInvoke(action, payload)`, `status()` delegate to
  [ChatterboxSetupActions](ChatterboxSetupActions.md).
- Host surface for the action classes: `ctx`, `voice`, `extensionId`, `store`,
  `engine`, `settings`, `jobs`, `runtimesDir()`, `modelsDir()`, `stopEngine()`
  (stop, ignoring failures), `log(msg)`.
