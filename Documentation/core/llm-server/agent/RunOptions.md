# RunOptions

`core/llm-server/agent/RunOptions.js`

The options of one `AgentRunner.run` call with defaults applied.

## Methods

- `RunOptions.normalize(options)`: `DEFAULTS` overlaid with every option that is
  not `undefined` (an explicit null is kept), plus `maxParallel`
  (`ToolConcurrency.resolveMaxParallel(maxParallelToolCalls)`) and `lazy`
  (`(lazyTab || noBrowser) && tabId == null`).

## Options

| Option | Default | Meaning |
|---|---|---|
| `prompt` | | the task |
| `priorTurns` | null | prior `{role, content}` turns sent as real messages |
| `tabId` | | use this tab; never created or closed |
| `autoCloseTab` | true | close a tab the run created |
| `includeScreenshot` | false | attach a final screenshot data URL |
| `maxIterations` | 15 | loop cap |
| `maxParallelToolCalls` | 1 | read-only pool size; 1 disables batching |
| `timeout` | 300000 | model wall clock in ms; 0 or Infinity for none |
| `onToolResultEvicted` | null | told `{tool, params}` when a result is dropped |
| `nativeTools`, `nativeToolsTokens` | false, 0 | schema cost taken out of the budgets |
| `tools` | | allow-list of tool names |
| `systemPromptAppend`, `systemPromptOverride` | | see AgentSystemPromptBuilder |
| `label` | null | AI Activity panel label |
| `promptExperiments` | null | eval-only prompt block drops |
| `onEvent`, `onWorkTab`, `shouldAbort` | | progress sink, tab hook, cooperative cancel |
| `lazyTab` | false | open the tab on first on-tab tool |
| `noBrowser` | false | no browser tools, no tab, browser-free prompt |
| `ctxPerSlot` | null | per-request window in tokens; sizes every budget |
| `resultSpill` | null | ToolResultSpill writer for over-budget results |
| `conversationId` | null | which background notices to relay |
| `carriedReasoning` | null | `{charsPerStep, charsTotal}` override |
| `screenshotVision` | false | screenshots return pixels for the bridge |
