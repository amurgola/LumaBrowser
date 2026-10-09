# WizardApis

`core/shell/ui/wizard/WizardApis.js` (ES module)

The llmDiagAPI-shaped transports the shared setup pipelines take, over the shell's generic ipcBridge (the shell has no llmDiagAPI preload).

## Methods

- `WizardApis.invoke(channel, ...args)`.
- `llm()` (getRuntimesView, installRuntime, downloadModel, setDefaults,
  startServer, setEnabled, setOpenTabOnLoad, getRamPinStatus, onRuntimeEvent,
  onModelEvent on `core.llmServer.*`), `llmImport()` (plus
  importExistingModel), `image()` (`core.imageServer.*` incl. modelCatalog and
  importExistingModel), `music()` (`core.musicServer.*`), `placement()`
  (`core.placement.setConfig`), `system()` (`core.llmServer.checkSystemLibraries`),
  `all()` (the AutoSetup apis object).
- `cancelDownload(server)`: fire-and-forget `core.<server>.cancelModelDownload`.

## Globals

Reads `window.ipcBridge` (invoke, on).
