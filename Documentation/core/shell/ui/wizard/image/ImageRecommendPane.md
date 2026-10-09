# ImageRecommendPane

`core/shell/ui/wizard/image/ImageRecommendPane.js` (ES module)

The image recommendation: runtime for this host plus the catalog model that fits one card, or the linked checkpoint.

## Methods

- `render(pane)`: reads `core.imageServer.getRuntimesView`,
  `core.imageServer.modelCatalog` and `core.llmServer.getWizardHardware`;
  picks with ImageRuntimePicker and ImageModelBudget (per card: sd.cpp cannot
  split an image model). Errors: "Image server is not available on this build:
  ...", "Couldn’t load the image catalog...", "No compatible image runtime for
  this platform.". "Download & set up" or "Link & set up" runs the runner.

## Globals

Reads `window.ipcBridge.invoke`.
