# ModelRuntimeMatch

`core/llm-server/server/launcher/ModelRuntimeMatch.js`

Refuses a model and runtime that cannot run together.

## Methods

- `ModelRuntimeMatch.refusal(model, runtime)` returns null or
  `{ success: false, error, code: 'MODEL_RUNTIME_MISMATCH' }`:
  - the runtime declares `modelKinds` without the model's `kind`:
    `<runtime> only loads <kinds> models; <model> is a <kind> model. Pick a matching model in Setup → Defaults.`
  - a non-`weights` model lists `compatibleRuntimes` without this runtime:
    `<model> only runs on <ids>; the selected runtime is <runtime>. Pick that runtime in Setup → Defaults.`
- `ModelRuntimeMatch.CODE`.

## Why

The Setup pickers already restrict these pairs; this is the main-process backstop
for stale defaults and API callers (an MLX directory must not reach llama-server).
