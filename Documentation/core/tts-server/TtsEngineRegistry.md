# TtsEngineRegistry

`core/tts-server/TtsEngineRegistry.js`

Lets an extension plug an alternate text-to-speech engine into voice mode (and
read-aloud, and the shared `/voice` routes) without touching the sherpa worker.
Its voices join the built-in picker under namespaced ids, and synthesis for them
is routed to the engine.

## Methods

- `TtsEngineRegistry.shared` is the process-wide instance used by
  `TtsServerService` and `ExtensionManager` (`context.registerTtsEngine`).
- `register(engine, extensionId?)` validates and stores the engine object
  itself, returning it. Throws `registerTtsEngine: ...` for a missing object, a
  blank id, an id containing `:`, or a missing `listVoices` / `synthesize` /
  `cancel`.
- `unregister(engineId)` returns whether it was removed.
- `unregisterByExtension(extensionId)` returns how many engines were removed.
- `list()` returns the engine objects; `get(engineId)` returns one or `null`.
- `resolve(modelId)` maps `ext:<engineId>:<voiceId>` to
  `{ engine, engineId, voiceId, voice }`, or `null` when the engine or voice is gone.
- `listVoiceEntries()` returns picker rows
  `{ id, name, description, quality, sizeBytes: 0, external: true, engineId, engineName, language }`.
  `name` falls back to the voice id, `quality` to `'clone'`, `engineName` to the
  engine id. A throwing `listVoices` contributes no rows.
- `TtsEngineRegistry.parseId(modelId)` returns `{ engineId, voiceId }` or `null`
  (the voice id may itself contain colons).
- `TtsEngineRegistry.makeId(engineId, voiceId)` returns `ext:<engineId>:<voiceId>`.
- Statics: `EXT_PREFIX` ('ext:'), `REQUIRED_METHODS`, `DEFAULT_QUALITY`.

## Engine contract

Duck-typed. Required: `id`, `listVoices() -> [{ id, name, description?, language?, quality? }]`,
`synthesize({ voiceId, text, speed }, onChunk) -> { id, done: Promise<{ canceled }> }`
(chunks `{ seq, sampleRate, pcm: Uint8Array Int16 LE }`, the sherpa worker's
shape), `cancel(id)`. Optional: `name`, `isReady(voiceId)`, `prewarm(voiceId)`, `stop()`.

## Why

A singleton for the same reason as SetupTabRegistry: `TtsServerService` is
built in main.js while extensions activate later through ExtensionManager, and
both must see one registry. Engines are stored as given, not copied, because
their methods may live on a class prototype. Picking an external voice stores
the namespaced id in the same setting the built-in tiers use. This registry does
not extend `ContributionRegistry` (core/shared/registry): that base stores shallow copies of
entries, which would drop prototype methods.
