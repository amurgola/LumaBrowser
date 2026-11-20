# PromptBenchSession

`tools/prompt-bench/PromptBenchSession.js`

## Methods

| Setting | Value |
|---|---|
| `core.llmServer.defaults.contextSize` | `options.ctx` |
| `core.llmServer.chat.lastModelRef` | `local::<options.model>` |
| `core.llmServer.chat.nativeToolCalls` | `options.native` (false forces the text fence) |
| `core.llm.traceCalls` | true |
| `aiChat.systemPrompt` | `PromptBenchCases.CUSTOM_PROMPT` |

  It then answers every tool approval with "allow for this run", sends one unscored Tools-off turn to load the model,
  and resolves `{ loadMs, warmUpError, server: { modelName, modelFamily, ctxPerSlot } }` from the live launch plan.
- `runCase(task)` sends the task's prompt, or each of its `turns` in one conversation (stopping at a turn that
  fails), with `tools` as the task says and a 5 minute limit per turn. Resolves
  `{ turns: [{ prompt, response, reasoning, toolCalls, error, ms }], transcripts, metrics, trace }`: `transcripts` are
  [PromptBenchTranscript](PromptBenchTranscript.md) results, one per turn; `metrics` are
  [PromptBenchTrace](PromptBenchTrace.md) figures over the conversation's trace file, read once it has stopped
  growing. Never rejects: a turn that throws is recorded with its error.
- `close()` closes the app and removes the trace files the run wrote into `<repo>/traces` (the dev app traces there),
  leaving any other file in that folder alone.
