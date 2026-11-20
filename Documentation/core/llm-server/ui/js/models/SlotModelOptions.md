# SlotModelOptions

`core/llm-server/ui/js/models/SlotModelOptions.js`

Fills a model slot's `<select>` (`window.llmSlotAPI`): "Use active provider (default)" first, then one option per
available model valued `providerId::modelId`. A slot's own choice that nothing offers any more is added as a
selected, disabled "Unavailable: <model>" option (`data-unavailable="true"`), so the picker shows what is saved and
not the default. Used by the AI Chat settings tab ([AiChatSettingsTab](../../../../../extensions/ai-chat/ui/AiChatSettingsTab.md)),
the test harness runner ([RunnerModelPicker](../../../../../extensions/ext-test-harness/ui/RunnerModelPicker.md)) and
the Timed Tasks navigator label ([TimedTasksSettingsPage](../../../../../extensions/timed-tasks/ui/TimedTasksSettingsPage.md)).

## Methods

All static.

- `fill(select, models, slotConfig)` rebuilds the options from `getAllAvailableModels()` rows and selects the
  slot's value; a value with no option falls back to the default.
- `isMissing(models, slotConfig)` whether the slot's own choice (`explicit: true` from `getSlotConfig`) is none of
  the listed models. A slot following the default is never missing.
- `labelFor(models, slotConfig)` the listed label, "Unavailable: <model>" for a missing own choice, else the model id.
- `valueOf(slotConfig)` the select value of a slot config, `''` when there is none.
- `parse(value)` `{ provider, model }` of a select value, `null` for the default option. Splits at the first `::`
  only, since a paired computer's model id has one of its own (`local::Qwen3-8B`).

Constants: `DEFAULT_LABEL`, `UNAVAILABLE_PREFIX`, `SEPARATOR`.

## Globals

None.
