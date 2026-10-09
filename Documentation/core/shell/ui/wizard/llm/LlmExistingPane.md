# LlmExistingPane

`core/shell/ui/wizard/llm/LlmExistingPane.js` (ES module)

The Switcher's first LLM view: models already on the machine, listed open with "Use this one" each (up to 12), before any download.

## Methods

- `new LlmExistingPane(wizard, step)`, `render(pane)`: scans once with
  `core.llmServer.scanExistingLibraries` (a failed scan is an empty result);
  "Download a model from the catalog instead" (or "Pick a model to download")
  goes to the questions; Rescan scans again; "Use this one" runs
  `runner.runImport(found)`.

## Globals

Reads `window.ipcBridge.invoke`.
