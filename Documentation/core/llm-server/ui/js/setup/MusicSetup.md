# MusicSetup

`core/llm-server/ui/js/setup/MusicSetup.js`

The music-server [setup pipeline](SetupPipeline.md).

## Methods

- `MusicSetup.run(api, { plan, ...hooks })`; `plan` is the planner's
  `plan.music` (`{ modelId }`); `api` is `llmDiagAPI.music`-shaped (`getView`,
  `installRuntime`, `downloadModel`, `setDefaults`, `setEnabled`,
  `onRuntimeEvent`, `onModelEvent`). Installs the managed Python environment
  when the first runtime row is not installed (pip lines surface as
  sub-lines), downloads the snapshot, saves `{ modelId }` and enables the tab
  (best effort). Resolves `{ ok: true }`. Fallback message: "Music setup failed".

There is deliberately no server start: loading the music model claims about
30 GB of VRAM, so the first generate cold-starts the server instead.

## Globals

None.
