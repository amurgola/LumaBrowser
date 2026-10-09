# TriggerStateView

`core/llm-server/chat/trigger-mode/TriggerStateView.js`

The current-state object of an existing trigger, shown to the setup model as
JSON. Used by [TriggerModePrompt](TriggerModePrompt.md).

## Methods (static)

- `build(trigger, extras = {}, bases = null)` returns, in order: `title`,
  `kind`, `status`, `statusMeaning`, `mode`, `agent`, then for webhooks
  `respond`, `preset`, `botGuard` (slack and github only) and `secret`
  (`extras.secret`); `watch` (file), `page` (page), `notification`, `expect`,
  `artifactRootId`, `gating`, `memory` (`{ runs, notes, updatedAt }` when memory
  is on), `failures`, `approval` (`TriggerStore.approvalPolicy`),
  `pendingApproval`, `drift` (with a note offering to update the prompt),
  `prompt`, `versions`, `enabled`, `urls`, `hasSample`, `lastTest`,
  `fireCount`, `lastFiredAt`, `lastStatus`. Keys that are `undefined` drop out
  of the JSON.
- `versions` lists `extras.versions` as `{ n, at, origin, tested, current,
  note, mode, prompt }`; the live version has no prompt (it is already in the
  state), older ones a 160-char preview.
