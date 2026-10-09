# ModelsCard

`core/llm-server/ui/js/setup-ui/models/ModelsCard.js`

The LLM Setup "Models Directory" card: directory controls, installed models through the shared model list (each with its fit matrix and fit-test block), the add-on models fold, and directory changes.

## Methods

- `new ModelsCard(ctx, modelList)`: `modelList` is the collaborator described in [SetupMain](../SetupMain.md) (namespaces `mlLlmRows`, `mlLlmAddon`).
- `render()`: models view plus the context-fit ladders, then `renderView`. `renderView(config, scan)`: the one-time scaffold, controls, empty note, rows, add-ons, then fit-test and gambit rehydration.
- `updateInstalledSummary()`, `applyDirChange(dir)` (null reverts to default; re-fetches ladders, repaints Models and Defaults), `refreshFitSections(htmlFor)`.
- Field `addons` ([AddonModels](AddonModels.md)).

## Globals

Reads `document` by id.
