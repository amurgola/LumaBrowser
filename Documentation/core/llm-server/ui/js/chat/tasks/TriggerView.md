# TriggerView

`core/llm-server/ui/js/chat/tasks/TriggerView.js`

A trigger's runs view: the header card ([TriggerHeaderHtml](TriggerHeaderHtml.md))
with its actions (copy URL or path, use the latest event as the sample, answer a
held approval, save the secret, send a test event, Arm or Pause, Edit in chat)
above the [TriggerSections](TriggerSections.md). Desktop only; a trigger deleted
underneath falls back to the landing.

## Methods

- `open(triggerId)`.
