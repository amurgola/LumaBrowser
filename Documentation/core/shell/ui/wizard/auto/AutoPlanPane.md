# AutoPlanPane

`core/shell/ui/wizard/auto/AutoPlanPane.js` (ES module)

Automatic Setup's plan preview.

## Methods

- `render(pane)`: plans once with `core.llmServer.planAutoSetup({ wantImage,
  wantMusic })` (a failure becomes the error view); shows the tier line, model
  (quant badge only for non-plain personas), the download line, the disk line
  (`core.llmServer.getStorageInfo`: "Needs ... you have ... free", warning under
  110%), the summary, the existing-checkpoint choice (`core.imageServer.scanExistingLibraries`,
  [AutoImageChoice](../../../../llm-server/ui/js/setup/AutoImageChoice.md)),
  and Set it up, Change answer (or for chat, Chat only / Add image
  generation), Customize instead (to the guided Workflow step).

## Globals

Reads `window.ipcBridge.invoke`.
