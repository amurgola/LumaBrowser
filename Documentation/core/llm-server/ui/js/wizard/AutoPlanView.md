# AutoPlanView

`core/llm-server/ui/js/wizard/AutoPlanView.js`

Automatic Setup's plan screen: calls `planAutoSetup({ wantImage, wantMusic })` once, then shows the picked chat model, the download line, the planner's reasons, the detected hardware, the image-checkpoint choice ([AutoImageChoice](../setup/AutoImageChoice.md), one scan per plan, undoable through `basePlan`), models already on disk, the storage line, "Set it up" and "Customize instead".

## Methods

- `AutoPlanView.render(wizard, body)`; `AutoPlanView.downloadLine(plan)` returns `{ total, text }` (bytes already on disk shrink the quote); `AutoPlanView.html(plan, downloadText, hw)`.

## Globals

None.
