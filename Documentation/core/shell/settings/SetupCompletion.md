# SetupCompletion

`core/shell/settings/SetupCompletion.js`

The first-run wizard's completion record and its direct-to-store writes.

## Methods

- `new SetupCompletion({ db, onSetupFinalized?, now?, logError? })`.
- `get()` `core.setupComplete` or null.
- `async complete(payload)` stores `{ completedAt, ...payload }` (a non-object
  payload counts as `{}`), saves a known `payload.persona` as the persona
  ([OnboardingPersona](OnboardingPersona.md)), and on the first-ever completion
  awaits `onSetupFinalized()`, logging (not returning) its failure.
  Returns `{ success: true }`.
- `reset()` deletes the record.
- `setDisabledExtensions(ids)` array only (`ids must be an array`), stored as
  `shell.extensions.disabled`.
- `setWebhookUrl(url)` string only (`url must be a string`), stored as `webhookUrl`.

## Why

`onSetupFinalized` is the deferred boot phase: extension activation, REST
server start, Chrome extensions and the ad blocker. The wizard cannot go
through extension-scoped IPC handlers because extensions are not active yet,
so it writes their settings keys here and they pick them up on activation.
