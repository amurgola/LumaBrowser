# TriggerFacts

`core/llm-server/chat/trigger-mode/TriggerFacts.js`

Small model-facing facts about a trigger, shared by the setup prompt's state
([TriggerStateView](TriggerStateView.md)) and the tool summaries
([TriggerSummary](TriggerSummary.md)).

## Methods (all static)

- `describeStatus(status, kind = 'webhook')`: what `awaiting_sample`,
  `needs_test`, `tested`, `armed` and `auto_paused` mean and what to do next,
  worded for the kind (file, notification, other); unknown statuses pass through.
- `hookUrls(trigger, bases)`: `{ local?, lan?, public? }` as
  `<base without trailing slash>/hooks/<hookToken>`, skipping empty bases;
  `null` without a token or bases.
- `gating(trigger)`: `{ filter?, cooldownSeconds?, batch?: { seconds, max },
  quietHours?, memory?: { runs, maxChars } }` or `null` when no gate is on.
- `failures(trigger)`: the effective `TriggerStore.failurePolicy` as
  `{ autoPauseAfter, notifyFailures, retryMax, retryBackoffSeconds }` plus
  `consecutiveFailures` and `pausedReason` when set.
- `watch(trigger)`: a file trigger's `{ dir, glob, events, recursive, allowWrite }`, else `null`.
- `page(trigger)`: `{ monitorId, url, name }`.
- `notification(trigger)`: `{ host?, tab?: { partition, title, url } }` for a
  notification trigger, else `undefined`.
- `agent(trigger, agents)`: `{ id, name }` for the configured agent, `{ id,
  missing: true, note }` when it is gone, `undefined` when none.
- `oneLine(text, max)`: whitespace collapsed, cut with `…` past `max`.
