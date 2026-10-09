# TriggerApprovalPolicy

`core/llm-server/chat/trigger-store/TriggerApprovalPolicy.js`

A trigger's approval policy. Extends [TriggerPolicy](TriggerPolicy.md).

## Methods

- `normalizeInto(source, out)`: stores `approval: 'ask'` only when asked, and
  `approvedTools` trimmed, deduplicated, non-empty, capped at `MAX_APPROVED_TOOLS` (50).
- `of(trigger)` returns `{ mode: 'auto' | 'ask', approvedTools }` (a copy).
- `withTool(trigger, name)`: the approved list plus `name`, deduplicated.
- `MODES`: `['auto', 'ask']`.

## Why

`auto`: headless runs never ask, mutating tools run. `ask`: a mutating tool
parks the run until a human answers on the card or in the runs view.
`approvedTools` are the names "Always allow" remembered.
