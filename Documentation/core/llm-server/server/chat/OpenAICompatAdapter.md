# OpenAICompatAdapter

`core/llm-server/server/chat/OpenAICompatAdapter.js`

The [ChatAdapter](ChatAdapter.md) for OpenAI-compatible servers. Every runtime in
today's catalog uses it: the llama.cpp builds, ik_llama, and strict servers such
as NInfer whose catalog entry carries a request profile.

## Members

- `static get protocolId()` is `'openai-compat'`.
- `healthCheck()` resolves true when `GET <baseUrl>/health` answers 200 within
  1.5 s, else false. The bearer is sent even though llama-server exempts
  `/health` from `--api-key`.
- `chat(options)` throws `chat: messages is required` on a missing or empty
  `messages`, otherwise starts a streaming completion and returns `{ abort() }`.
  Options: `messages, temperature, maxTokens, tools, chatTemplateKwargs,
  reasoningBudget, samplerOverrides, familySamplerDefaults, onDelta,
  onReasoningDelta, onDone, onError`.
  - `onDelta(text, frame)` gets answer text; `onReasoningDelta(text, frame)`
    gets `delta.reasoning_content`.
  - `onDone(summary)` fires once with
    `{ finishReason, stopReason, usage, timings, toolCalls }` (see
    [OpenAiChatStream](OpenAiChatStream.md)).
  - `onError(error)` gets transport failures; HTTP failures read
    `Chat request failed: HTTP <status> <statusText> - <server message>`.
  - `abort()` cancels the request; neither `onDone` nor `onError` follows.
- `HEALTH_TIMEOUT_MS` (1500).

## Body

Built by [OpenAiChatBody](../../../shared/llm/OpenAiChatBody.md) with
`stream: true` and `local: true` (this adapter only talks to the managed server,
so the llama.cpp sampler and `cache_prompt` always apply). Sampler precedence:
house temperature, then `familySamplerDefaults` (the model's published sampler
from the launch plan), then `samplerOverrides`. `model` is set only when the
adapter has one (`plan.apiModelName`). Finally
[RequestProfile](RequestProfile.md)`.apply(body, this.request)` rewrites it for a
strict server.

## Collaborators

- [OpenAiChatRequest](OpenAiChatRequest.md) posts and retries.
- [OpenAiChatStream](OpenAiChatStream.md) handles every SSE frame.
- [ChatErrorBody](ChatErrorBody.md) and [TimingsUsage](TimingsUsage.md).
