# ChatJobSource

`extensions/desktop-integration/features/jobs/sources/ChatJobSource.js`

Chat replies in flight, from the chat router (`UnifiedChatRouter`, published as
`global.__lumaChatRouter`). Its `active` getter is the single in-flight turn's
abort handle (null when idle); every chat surface that streams through the
router (the chat tab, agent runs, the On Demand overlay, context.chat) sets it.

- Polls `active` every second (`POLL_MS`) and once on `start()`. A new handle
  starts a `chat` job ("Chat reply", indeterminate); the handle clearing
  finishes it as `done`; a different handle finishes the old job and starts a
  new one.
- Cancel = the chat's own Stop: `router.abort()` (also stops agent runs and
  reclaims a local slot). The job finishes as `canceled` at once.
- `stop()` clears the timer. A missing router is idle.

Limits: a reply shorter than the poll interval may not show; the title does not
name the conversation.
