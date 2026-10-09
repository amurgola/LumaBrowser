# LlmRuntimesView

`core/shell/extensions/LlmRuntimesView.js`

Drops the LLM server's cached runtimes view after an extension adds or removes a runtime.

## Methods

- `LlmRuntimesView.invalidate(coreServices)` calls `invalidateRuntimesCache()`
  on `coreServices.llmServer` or `global.__lumaLlmServerService`; never throws.
