# LlmAvailability

`core/llm-server/ipc/LlmAvailability.js`

The compact "can I chat right now" state the browser chrome binds its status dot to.

## Methods

- `new LlmAvailability({ llmServerService, chatRouter, broadcast? })`; `broadcast(channel, message)`
  defaults to `LlmServerBroadcast.toAll`.
- `state()` `{ success: true, status, configured, model, label }`:
  - no listed model or provider: `off`, `configured: false`, `No model configured`;
  - supervisor `starting` / `stopping` -> `starting`; `error` -> `error`
    (`Server error: <lastError, 120 chars>` when known);
  - `ready` -> `waiting` when in-flight >= slots, `busy` when > 0, else `ready`;
  - `idle` -> `off` (`Stopped, starts on first message`) for a local default,
    else `ready`.
  - `model` is the running plan's `modelName | modelLabel | model`, else the
    default's label or ref. A throwing `listModels` counts as no models.
- `safeState()` `state()`, or `{ success: false, error, status: 'error', configured: false, model: null, label }`.
- `watch()` publishes on every supervisor `state-change` and every in-flight change.
- `publish()` sends the state on `core.llmServer.state` when it differs from the
  last one sent (a throwing `state()` publishes `status: 'error'`).
- `LABELS`, `OFF_LABEL`, `CHANNEL`.
