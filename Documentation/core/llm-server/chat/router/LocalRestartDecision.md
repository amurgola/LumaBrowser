# LocalRestartDecision

`core/llm-server/chat/router/LocalRestartDecision.js`

Decides whether the managed local server must be (re)started before a chat request, and why.

## Methods

All static.

- `decide({ switched, defaults, status, dirty, imageCount })` returns `{ reason, wantVision, haveVision, desiredCtx, runningCtx }`. `reason`, in precedence: `switching-model` (switched), `switching-context` (ready, both sizes known and different), `loading-vision` (ready, an image, the plan offers a projector, none loaded), `recovering-cancelled` (dirty), `starting-server` (not ready), else null.
- `runningCtx` is the plan's `requestedContextSize`, else `contextSize`; `wantVision` is optimistic on a cold start (no plan).

## Why

Comparing the clamped plan size against the unclamped request restarted the server on every turn. Vision is load-only: unloading would thrash an agent run whose image rides iteration 1 only; the projector drops for free at the next restart.
