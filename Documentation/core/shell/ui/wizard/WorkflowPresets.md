# WorkflowPresets

`core/shell/ui/wizard/WorkflowPresets.js` (ES module)

The workflow presets: which bundled extensions each starting point enables and disables. chat and create are hidden persona presets. Notification Gateway and Full Studio also enable the Hub (`personal-hub`), which feeds on the intercepted notifications.

## Methods

- `WorkflowPresets.PRESETS` `[{ id, title, badge, desc, enabled, disabled, hidden?, custom? }]`;
  `LLM_DEPENDENT` (ai-chat, selenium-driver).
- `find(id)`, `visible()` (the Workflow cards), `applyTo(overrides, presetId)`
  (writes by id so the choice holds before the extension list loads; Custom
  changes nothing), `needsLlm(enabledIds)`.

## Globals

None.
