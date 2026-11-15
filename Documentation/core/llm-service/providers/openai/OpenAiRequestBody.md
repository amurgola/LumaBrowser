# OpenAiRequestBody

`core/llm-service/providers/openai/OpenAiRequestBody.js`

Builds the `/v1/chat/completions` body for OpenAICompatibleProvider.

## Methods

- `build(messages, options, { streaming, endpoint, managedLocal, selectedModel })`
  returns the body from [OpenAiChatBody](../../../shared/llm/OpenAiChatBody.md),
  or null when neither `options.model` nor `selectedModel` is set:
  - `local`: `options.local` when given, else `managedLocal`.
  - `promptCacheKey`: the `sessionId` when `options.promptCacheKey === true`,
    or when it is not `false` and the endpoint is OpenAI's own host.
  - `cacheControl: 'anthropic'` (or `cache_control`) marks messages with
    [AnthropicCacheControl](AnthropicCacheControl.md).
  - `extra`: every option not in `LOCAL_OPTION_KEYS`, forwarded verbatim.
- `endpointSupportsPromptCacheKey(endpoint)`: `api.openai.com` or `*.openai.com`.

## Why

Most local servers (LM Studio, llama.cpp, some Ollama builds) reject unknown
body fields with an opaque error, so `prompt_cache_key` is off by default
outside OpenAI. `max_tokens` is a local key because the shared builder only
sends positive values; forwarding it verbatim once let `-1` reach strict vLLM.

## Changes (2026-11-14, thinking knobs under their wire names)

`chatTemplateKwargs` and `reasoningBudget` are local keys now, handed to the shared builder, which writes `chat_template_kwargs`, `reasoning_budget` and `reasoning_budget_tokens`. Forwarded verbatim they reached the server in camelCase, which no server reads: a paired LumaBrowser host took the request as silent about thinking and applied its own dial, so a call that asked for thinking off reasoned anyway.
