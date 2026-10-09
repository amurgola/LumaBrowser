# OpenAICompatibleProvider

`core/llm-service/providers/OpenAICompatibleProvider.js`

LLM provider for any OpenAI-compatible endpoint: LM Studio, llama.cpp
(including the managed local server), vLLM, OpenAI, proxies and Network
Sharing peers. Extends [BaseLlmProvider](BaseLlmProvider.md) and runs its contract test.

## Methods

- `new OpenAICompatibleProvider(db)`: settings under `lmStudio.*`, empty default endpoint.
- `capabilities`: tools, cache prefix and reasoning stream supported; no
  forced `max_tokens` (the server's own default applies).
- `managedLocal` (public, not persisted) and `setManagedLocal(bool)`: set by
  LLMService on the provider bound to our own llama-server; opens the
  llama.cpp-only body knobs.
- `testConnection()` (5 s), `fetchModels()`: GET `/v1/models`; refuse without an endpoint.
- `postJson(path, body, { timeout = 5000 })`: a JSON POST to a sibling path
  with the same auth and agents (the sharing host's abort endpoint). Throws
  without an endpoint.
- `sendChatCompletion(messages, options)`: 30 s default; returns the server body.
- `createChatCompletionStreamSession(messages, options, handlers)`: 120 s
  default. Handlers: `onDelta(text, frame)`, `onReasoning(text)`,
  `onStatus(payload)`, `onUsage(usage)`, `onError(message)`,
  `onToolCallDelta({ index, id, name, argsDelta })`, `onToolCall(call)`.
  The response adds `toolCalls` (with `parsedArguments`) and `stopReason`
  (`'repetition'` when we aborted a loop) beside the OpenAI fields.
- `KEEPALIVE_HTTP_AGENT`, `KEEPALIVE_HTTPS_AGENT`: shared keep-alive agents.

## Options

Body building is [OpenAiRequestBody](openai/OpenAiRequestBody.md): provider-only
options (`timeout`, `sessionId`, `cacheControl`, `promptCacheKey`, `local`,
`samplerOverrides`, `repetitionGuard`, `max_tokens`, `model`) are consumed and
everything else is forwarded verbatim. `sessionId` also adds
[SessionAffinity](openai/SessionAffinity.md) headers.

## Why

- Keep-alive agents reuse one connection per endpoint, shaving socket and TLS
  setup off first-token latency. A pinned sharing peer gets its
  pin-enforcing agent from [PinnedTls](../../network-sharing/tls/PinnedTls.md)
  instead; its self-signed certificate cannot validate any other way.
- Bug H8: the managed llama-server is reached both by the chat tab adapter
  and through this provider; both now send the same body and run the same
  loop guard. Streaming details are in [OpenAiStreamReader](openai/OpenAiStreamReader.md).
