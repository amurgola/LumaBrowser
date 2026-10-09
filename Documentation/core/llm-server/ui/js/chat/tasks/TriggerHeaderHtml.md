# TriggerHeaderHtml

`core/llm-server/ui/js/chat/tasks/TriggerHeaderHtml.js`

The trigger header card markup: status, source and fire facts plus the extra
facts (agent, expected result keys, fed artifact, filter, cooldown, batch,
approval, quiet hours, memory, bot guard, held deliveries), the paused reason,
the payload-drift notice, a pending approval, the source rows (folder,
notification tab and site, page and monitor, or webhook URLs with the secret row
and a curl example) and the action buttons. Every value is escaped.

## Methods

- `TriggerHeaderHtml.html({ t, baseUrls, watch, secret, pending })`.
- `sourceFact(t)`, `extraFacts(t, pending)`, `driftHtml(t)`,
  `approvalHtml(pending)`, `sourceRows(info)`, `kind(t)`.
