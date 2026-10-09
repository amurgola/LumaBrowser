# ImageAskPane

`core/shell/ui/wizard/image/ImageAskPane.js` (ES module)

The image step's first view: checkpoints the user already has (ComfyUI, Forge, SD WebUI and friends, up to 8) with "Use this one", then Set it up and Skip for now.

## Methods

- `render(pane)`: the existing block scans once with
  `core.imageServer.scanExistingLibraries` and stays empty on failure; Skip
  resolves the step without marking it done; Set it up or "Use this one" opens
  the recommendation.

## Globals

Reads `window.ipcBridge.invoke`.
