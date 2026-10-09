# AgentRunner

`core/llm-server/agent/AgentRunner.js`

The headless agentic tool loop for programmatic AI chat: the chat bridge, the
ai-chat REST/MCP front doors, timed tasks and the eval adapter all drive the
model through it. It is a facade: [AgentRun](AgentRun.md) does one run and
[AgentSystemPromptBuilder](AgentSystemPromptBuilder.md) renders the prompt a
run would send.

## Methods

- `new AgentRunner(llmService, services, db)`: `llmService` needs
  `sendCompletion(slotId, messages, opts)` and `browserTools` (the parser and
  executor, normally [BrowserTools](../../llm-service/BrowserTools.md) or the
  bridge's wrapper with the loose/XML/Harmony recovery parsers). `services` is
  `{ browserService }`. `db` is the settings store (`get(key, fallback)`); it
  may be null.
- `run(options)` resolves to the run result (see below). Options and defaults
  are listed in [RunOptions](RunOptions.md).
- `buildSystemPrompt({ tabInfo, defaultTabId, allowedTools,
  systemPromptAppend, systemPromptOverride, noBrowser, parallelToolCalls,
  promptExperiments })` returns the exact prompt a run would send. The bridge's prompt preview and the tool-selection probe use it.

## Run result

`{ finalResponse, tabId, createdTab, iterations, durationMs, toolCalls, steps,
systemPrompt, error, overflowRecoveries, compactions }`, plus `summary` when
the run ended with an answer and no error, and `screenshot` (data URL) when
`includeScreenshot` was set. `toolCalls` is `[{ tool, params, durationMs,
success, error }]`; `steps` is the per-iteration trace (tool steps, nudges,
compactions, overflow recoveries, notice relays, `llmError`). `error` is
`null`, `'aborted'`, the timeout report, or the completion error.

## Events (`onEvent`)

`tool` (before a call), `tool-result` (with `summary`, `artifact`, `meta` from
[ToolPresentation](../chat/ToolPresentation.md) and `image` for pictures),
`final`, `final-retracted` (a held-back answer), `compacting`, `compacted`.

## How a run flows

Open the working tab ([WorkTab](WorkTab.md)), build the prompt, then per
iteration: stop on the wall clock ([RunClock](RunClock.md)) or a cancel, expire
the screenshot note, warn in the last two steps, compact proactively
([MidTurnCompactor](MidTurnCompactor.md)), relay background notices
([AgentNotices](../../shared/AgentNotices.md)), send the completion
([CompletionSender](CompletionSender.md)), recover an overflow
([OverflowRecovery](OverflowRecovery.md)), then either review the answer
([FinalAnswerGate](FinalAnswerGate.md)) or run the tool batch
([ToolBatchRunner](ToolBatchRunner.md)). The history and its budgets live in
[AgentHistory](AgentHistory.md).

## Why it lives in core

In legacy the agent loop sat in the ai-chat extension while core
(AgentChatBridge, the eval adapter) required it, a layering violation. It is
core now; the extension depends on core.
