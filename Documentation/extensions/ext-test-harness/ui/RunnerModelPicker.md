# RunnerModelPicker

`extensions/ext-test-harness/ui/RunnerModelPicker.js`

The Test Runner Model select on the Test Harness settings tab.

## Methods

- `new RunnerModelPicker(select)`: `select` is `#ext-th-modelSelect` or null.
- `bind()`: saves on `change`.
- `populate()`: resets to `Use active provider (default)`, then appends one
  option per available model (`<providerId>::<modelId>`, the model label),
  selecting the one stored in the `ext-test-harness.runner` slot. Does nothing
  without the select or `window.llmSlotAPI`; failures are logged.
- `save()`: a value sets the slot (`setSlotConfig(slot, provider, model)`),
  the empty value clears it.

## Globals

Reads `window.llmSlotAPI` (`getAllAvailableModels`, `getSlotConfig`,
`setSlotConfig`, `clearSlotConfig`).
