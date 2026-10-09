# AutoQuestionPanes

`core/shell/ui/wizard/auto/AutoQuestionPanes.js` (ES module)

Automatic Setup's image and music questions.

## Methods

- `image(pane)`: yes or no, then the music question (not on a Mac) or the
  plan; the hardware line fills from `core.llmServer.getWizardHardware` in the
  background. `music(pane)`: yes or no, then the plan. Each answer drops the plan.

## Globals

Reads `window.ipcBridge.invoke`, `navigator.platform` (through the wizard).
