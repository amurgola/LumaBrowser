# DoneStep

`core/shell/ui/wizard/steps/DoneStep.js` (ES module)

The review step: Path or Workflow, Features, Chat model or LLM, Images, the Builder's Agent API line, Webhook, the "Check for updates automatically" box and the status line.

## Methods

- `render()`: plain personas see Path and Ready labels instead of Workflow,
  Features and model names; the Agent API line fills from `getApiPort` and
  `getMcpEnabled`; the update box reflects `getAutoCheckUpdates` (default on).

## Globals

Reads `window.electronAPI` (getApiPort, getMcpEnabled, getAutoCheckUpdates).
