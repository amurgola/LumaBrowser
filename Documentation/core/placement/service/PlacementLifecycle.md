# PlacementLifecycle

`core/placement/service/PlacementLifecycle.js`

Starts the saved placement layout and unloads every managed model.

## Methods

- `new PlacementLifecycle({ servers, settingsDb, gate, prewarmer, getLauncher })`;
  `getLauncher()` returns something with `resolveAndStart(llmServerService)`.
- `startAll()`:
  - the [gate](PlacementGate.md) refuses: `{ success: false, error: UNMEASURED_ERROR }`;
  - any hotswap pool: warm the pool in the background, start only the LLM:
    `{ success: true, results, hotswap: true }`;
  - else the LLM, then `startServerResolved(modelId || undefined, { role: 'image-generate' })`,
    then edit and video when selected: `{ success: true, results }`.
  `results` is `{ llm, generate, edit, video }` (null when not started); a start
  that throws becomes `{ success: false, error }`.
- `stopAll()` stops the LLM runtime server, `image.shutdown()`,
  `music.stopServer()`, `grounding.stop()`, ignoring failures: `{ success: true }`.
- `UNMEASURED_ERROR` = `Run a test render first: placed models need a measured VRAM/RAM footprint before allocation.`

## Why

The LLM starts first because the VRAM ledger is first come first serve. A
singularity holds one model at a time, so preloading every member would thrash
down to the last one. Music is never preloaded: its cold start is minutes and
tens of GB for a slot most sessions never touch. `stopServer()`, not
`shutdown()`, for music: shutdown also tears down its downloads and installs.
