# HelperRuntimeServer

`core/llm-server/helper/HelperRuntimeServer.js`

Supervises the helper model's own llama-server (a `BaseRuntimeServer`
subclass): spawn from a [HelperLaunchPlan](HelperLaunchPlan.md) launch, the
idle, starting, ready and stopping states, the health wait on `GET /health`
(200 once the model is loaded), and a stop that waits for the process to exit.

## Methods

- `HelperRuntimeServer.findFreePort()` a port in the `helper` window
  (`FreePort.PORT_WINDOWS.helper`, 8220 to 8239).
- Hooks: `_logTag()` `[helper-model]`, `_processNoun()`, `_loadingLabel()`,
  `_healthCheck()`.
