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
- With `options.endpoint` the run goes to a server that is already running instead of the managed local model.
  `options.model` is then the model id that server lists and `options.ctx` the window it was started with. The
  settings above get one more key, `llm.providerConfigs`, holding a single OpenAI-type config
  (`ENDPOINT_PROVIDER_ID` `prompt-bench-endpoint`, the endpoint, the one model with `luma_context` set to the
  window so [ModelContextWindow](../../core/llm-server/chat/router/ModelContextWindow.md) can answer). It
  replaces the seed's list in the temp data dir. The model ref is `prompt-bench-endpoint::<options.model>`, the
  chat registers tools natively (see [ModelCapabilities](../../core/llm-server/chat/router/ModelCapabilities.md)),
  and only the temperature and the thinking knobs ride with a request, so the server's own sampler defaults apply
  ([RemoteStream](../../core/llm-server/chat/router/RemoteStream.md)). `open()` then resolves
  `server: { modelName, modelFamily: null, ctxPerSlot: options.ctx, endpoint }`, where `modelName` is
  `options.model` only when the chat really sits on that ref, and the ref it sits on otherwise, so the
  command's model check stops a run that would have used another model.
- `runCase(task)` sends the task's prompt, or each of its `turns` in one conversation (stopping at a turn that
  fails), with `tools` as the task says and a 5 minute limit per turn. Resolves
  `{ turns: [{ prompt, response, reasoning, toolCalls, error, ms }], transcripts, metrics, trace }`: `transcripts` are
  [PromptBenchTranscript](PromptBenchTranscript.md) results, one per turn; `metrics` are
  [PromptBenchTrace](PromptBenchTrace.md) figures over the conversation's trace file, read once it has stopped
  growing. Never rejects: a turn that throws is recorded with its error.
- `close()` closes the app and removes the trace files the run wrote into `<repo>/traces` (the dev app traces there),
  leaving any other file in that folder alone.
