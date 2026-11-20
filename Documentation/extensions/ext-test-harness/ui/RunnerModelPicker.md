# RunnerModelPicker

`extensions/ext-test-harness/ui/RunnerModelPicker.js`

The Test Runner Model select on the Test Harness settings tab.

## Methods

- `new RunnerModelPicker(select)`: `select` is `#ext-th-modelSelect` or null.
- `bind()`: saves on `change`.
- `populate()`: through
  [SlotModelOptions](../../../core/llm-server/ui/js/models/SlotModelOptions.md)`.fill`,
  resets to `Use active provider (default)`, then one option per available model
  (`<providerId>::<modelId>`, the model label), selecting the one stored in the
  `ext-test-harness.runner` slot; a stored model that is gone shows as a selected,
  disabled "Unavailable: <model>". Does nothing without the select or
  `window.llmSlotAPI`; failures are logged. On save `SlotModelOptions.parse` splits
  at the first `::` only, since a paired computer's model id has one of its own
  (`local::Qwen3-8B`).
- `save()`: a value sets the slot (`setSlotConfig(slot, provider, model)`),
  the empty value clears it.

## Globals

Reads `window.llmSlotAPI` (`getAllAvailableModels`, `getSlotConfig`,
`setSlotConfig`, `clearSlotConfig`).
