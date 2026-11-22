# ModelFrameworkPin

`core/llm-server/ui/js/setup-ui/models/ModelFrameworkPin.js`

The "Framework" select in a model row's details: pins one model to one of the installed frameworks that load its format.

## Methods

- `ModelFrameworkPin.html(m, frameworks, { path, key })`: empty unless the store has a view, the model has a weights path and `frameworks.format(m.servedBy.format).needsChoice`. Otherwise `label.model-frame-pin` with the label "Framework", a select (`data-model-framework=<weights path>`, `data-ml-change="framework"`, `data-key`) whose first entry is "Default (<the format's default framework>)" (value empty) and then each of the format's `frameworkIds` by name, and a `[data-model-framework-status]` span. The selected entry is `servedBy.pinnedFrameworkId` when it is one of them, else the default entry.
- `new ModelFrameworkPin(ctx)`; `save(select)`: `api.setModelFramework(path, frameworkId | null)` with the select disabled meanwhile. On success the returned `view` goes into `ctx.frameworks.setView`, `ctx.refreshLibrary()` repaints, and a `serverStopped` answer is reported through the Defaults card's `showSaveNote(true)`. On failure the select goes back to the saved entry and the error ("Save failed." without one) stays in the status span.

## Why

[ModelsCard](ModelsCard.md) routes the change through the shared list's `onChange` hook (`data-ml-change`), so the body-wide SetupClickRouter needs no entry for it. A plain success shows itself in the select and in the repainted frames, so it gets no message.
