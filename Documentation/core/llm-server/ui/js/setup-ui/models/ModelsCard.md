# ModelsCard

`core/llm-server/ui/js/setup-ui/models/ModelsCard.js`

The LLM Setup "Models Directory" card: directory controls, installed models through the shared model list in frames by the framework that runs them (each row with its fit matrix, fit-test block and framework pin), the add-on models fold, and directory changes.

## Methods

- `new ModelsCard(ctx, modelList)`: `modelList` is the collaborator described in [SetupMain](../SetupMain.md) (namespaces `mlLlmRows`, `mlLlmAddon`).
- `render()`: models view plus the context-fit ladders, and the frameworks view (`ctx.frameworks.load(api)`) when the store has none yet, since the frames are named and ordered by it; a failed load leaves the frames on the ids. Then `renderView`. The rows come from [LlmModelRow](LlmModelRow.md)`.views(models, ctx.frameworks)`, split by [ModelFrames](ModelFrames.md). `renderView(config, scan)`: the one-time scaffold, controls, empty note, rows, add-ons, then fit-test rehydration.
- `updateInstalledSummary()`, `applyDirChange(dir)` (null reverts to default; re-fetches ladders, repaints Models and Defaults), `refreshFitSections(htmlFor)`.
- Fields `addons` ([AddonModels](AddonModels.md)) and `drafters` ([DrafterDownloads](DrafterDownloads.md)): the LLM list is mounted with an `onAction` that opens `drafterModal` ([DrafterModal](DrafterModal.md)) for the `drafter` action and routes every other row action to `drafters`, whose controller is attached once the list exists.
- Field `pins` ([ModelFrameworkPin](ModelFrameworkPin.md)): the LLM list's `onChange` hook sends a `[data-model-framework]` select's change to `pins.save`.

## Globals

Reads `document` by id.
