# LocalRestartDecision

`core/llm-server/chat/router/LocalRestartDecision.js`

Decides whether the managed local server must be (re)started before a chat request, and why.

## Methods

All static.

- `decide({ switched, defaults, status, dirty, imageCount })` returns `{ reason, wantVision, haveVision, desiredCtx, runningCtx }`. `reason`, in precedence: `switching-model` (switched), `switching-context` (ready, both sizes known and different), `loading-vision` (ready, an image, the plan offers a projector, none loaded), `recovering-cancelled` (dirty), `starting-server` (not ready), else null.
- `runningCtx` is the plan's `requestedContextSize`, else `contextSize`; `wantVision` is optimistic on a cold start (no plan).

## Why

Comparing the clamped plan size against the unclamped request restarted the server on every turn. Vision is load-only: unloading would thrash an agent run whose image rides iteration 1 only; the projector drops for free at the next restart.

## Drafter choice

`decide` also takes `drafterKey`, the model's saved Drafter dialog choice as
[LlmDrafterChoices.keyOf](../../service/LlmDrafterChoices.md) (`auto`, `off`, `mtp`,
`file:<path>`). A ready server whose plan recorded another `drafterChoiceKey` restarts
with reason `switching-drafter` (after a model or context switch, before vision). A plan
without the field (MLX, or launched before it existed) or an unknown key never restarts
on it.
