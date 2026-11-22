# FrameworkControls

`core/llm-server/ui/js/setup-ui/frameworks/FrameworkControls.js`

What the Frameworks card's own controls do. Each saves on change through the framework IPC ([LlmRuntimeApi](../../../../preload/LlmRuntimeApi.md)):

- `[data-fw-active-build]` -> `setActiveBuild(frameworkId, runtimeId)`
- `[data-format-framework]` -> `setFormatFramework(format, frameworkId)`
- `[data-fw-option]` -> `setFrameworkOption(frameworkId, optionId, value)`

## Methods

- `wire(body)`: one `change` listener per control (a segmented picker fires a non-bubbling change on its hidden input, so delegation would miss it).
- `FrameworkControls.optionOf(el)`: `{ frameworkId, optionId }` from `data-fw-option`.
- `FrameworkControls.valueOf(el)`: by `data-fw-value` ([FrameworkOptionRows](FrameworkOptionRows.md)`.VALUE`): a boolean, its inverse, a number, the picked id, or null for an empty optional (OpenVINO Auto).
- On success the returned view goes into [FrameworkStore](FrameworkStore.md)`.setView`; then `RuntimesCard.afterFrameworkSave(saved, serverStopped, selection)` repaints (also after a failure, so the control shows the stored value again), redraws the Chat defaults line and, for a build or format choice, the model rows, and shows the "Saved." or "model stopped" note ([SaveNote](../defaults/SaveNote.md)).
