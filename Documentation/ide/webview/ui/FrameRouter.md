# FrameRouter

`ide/webview/ui/FrameRouter.js`

Renders the terminal bridge's frames (the chat router's events, relayed verbatim by the host): `meta`, `status`,
`delta`, `reasoning-delta`, `rollback`, `tool` (pending, run, done/result, cancel, approval, approval-done),
`command:output`, `artifact`, `agent`, `queued`, `followup-start`, `busy`, `bridge-error`, `done`, `error`,
`suggest`, `open-in-app-result`. Other types are the host's business and are ignored.

## Methods

- `new FrameRouter(page)`; `route(type, payload)`.
