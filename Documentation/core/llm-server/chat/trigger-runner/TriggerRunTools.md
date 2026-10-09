# TriggerRunTools

`core/llm-server/chat/trigger-runner/TriggerRunTools.js`

The run-scoped tools a trigger run gets as the bridge's `extraTools` (never in
the global catalog).

## Methods

- `TriggerRunTools.build({ trigger, event, state, triggerStore, emitEvent })`
  returns, in order: the file trigger's tools
  ([TriggerFileTools](../triggers/TriggerFileTools.md)`.build(trigger, event)`),
  [SaveMemoryTool](SaveMemoryTool.md) when the trigger keeps memory (a save
  sets `state.memorySaved` and emits `triggers-changed`), and
  [RespondToWebhookTool](RespondToWebhookTool.md) for a webhook in `result`
  mode (sets `state.responseBody`).
- `TriggerRunTools.allowList(allowedTools, extraTools)`: the allow-list plus
  the extra tools' names (deduplicated). The bridge gates on an explicit list
  verbatim, so without this a model's respond_to_webhook call was refused (seen
  live: the model printed the JSON as text instead). null (unrestricted) stays null.
