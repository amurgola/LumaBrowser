# ContextEstimator

`core/llm-server/ContextEstimator.js`

Per-model context options for the chat-mode model picker and the Setup tab's
fit matrix. Every rung is either a persisted fit-test measurement or an
estimate from the same planner that starts the server ([PlanFor](server/PlanFor.md)).

## Methods

- `ContextEstimator.shared` the instance over `PlanFor.shared` and
  `LlmRuntimeCatalog.shared`.
- `new ContextEstimator({ planFor, catalog })` (both optional) for tests.
- `buildLocalModelOptions({ models, fitResults, runtime, resolveRuntime, diagnostics, displayNameFor })`
  returns one entry per chattable model ([ModelContextEntry](context/ModelContextEntry.md)):
  - `models`: the scanner's `models`; companion-only entries (`mmproj-only`,
    `mtp-only`, no `weights[0].path`) are skipped.
  - `fitResults`: `{ <weights[0].path>: { ranAt, hardware, results: [row] } }`.
  - `resolveRuntime(model)` wins over `runtime`; a throw means no runtime
    (every estimate reads `unknown`).
  - `displayNameFor(nameKey, name)` gives `displayName`, else the scan name.
  - Models with a fit run sort first, newest `ranAt` first; the rest keep scan order.
- `ContextEstimator.measuredComboVram(fitEntry, tokens, kv)` see
  [FitRows](context/FitRows.md).
- `ContextEstimator.ctxLabel(tokens)`, `ContextEstimator.CTX_LADDER` see
  [ContextLadder](context/ContextLadder.md).

## Entry shape

`{ ref: 'local::<nameKey>', name, nameKey, displayName, path, quant,
architecture, nativeCtx, totalBytes, hasFit, ranAt, hardware, summary,
contextOptions, kvOptions, kvModes, recommendedTokens, speed }`.

- `kvOptions[modeId]` a strict ladder per offered KV mode (f16, q8_0).
- `contextOptions` the auto-picked ladder ([AutoContextPick](context/AutoContextPick.md)).
- A rung is `{ tokens, label, source: 'fit'|'estimate', state: 'ok'|'partial'|'no'|'unknown',
  kv, tokensPerSec, tokensPerSecSource: 'measured'|'predicted'|null, vramBytes, tip }`.
- `kvModes` `[{ id, short, help }]` for the offered modes.
- `summary` `quant · architecture · <n>k native · <size>`.
- `speed` `{ depth, kv, measured, predicted, measuredAtDepth }` or null.

## Flow

[ContextRungBuilder](context/ContextRungBuilder.md) builds each rung from
[FitRows](context/FitRows.md) (measured ok, then measured failure) or
[RungEstimator](context/RungEstimator.md) (planner estimate), with
[RungTip](context/RungTip.md) for the hover text. The ladder comes from
[ContextLadder](context/ContextLadder.md).

## Why

Bug H6: the Setup tab used to compute the fit matrix in the renderer and got
SWA, GQA, no-flash-attention overhead and multi-GPU placement wrong, so a
Gemma-class model read red at 128k while Start launched it at full offload. The
payload now carries both KV ladders, the tips and the mode table, so the
renderer only renders. Bug H12: MLX models go to the MLX planner through
PlanFor, so they no longer read "doesn't fit" at every rung.
