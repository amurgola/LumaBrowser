# LlmServerSettings

`ui/shell/settings/general/LlmServerSettings.js`

LLM server switch, open-on-launch and call tracing (locked on when forced by --trace-llm) with Clear.

## Methods

- `install()`, `load()`, `syncRows()`, `applyTraceStatus(st)`.

## Globals

Reads `window.ipcBridge.invoke('core.llmServer.*')`.
