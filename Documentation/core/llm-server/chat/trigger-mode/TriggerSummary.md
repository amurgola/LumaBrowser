# TriggerSummary

`core/llm-server/chat/trigger-mode/TriggerSummary.js`

The compact trigger description the setup tools return.

## Methods (static)

- `of(trigger, services)` returns `{ id, title, kind, status, statusMeaning,
  mode, agent, enabled }` plus, by kind: `watch` (file), `page` (page),
  `notification` (notification), or for webhooks `respond`, `preset`, `urls`
  (from `services.hookBaseUrls()`) and `secret` (`services.secretStatus`); then
  `expect`, `artifactRootId` and `gating` when set. Facts come from
  [TriggerFacts](TriggerFacts.md).
