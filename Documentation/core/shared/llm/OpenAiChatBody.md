# OpenAiChatBody

`core/shared/llm/OpenAiChatBody.js`

The one builder for an OpenAI-compatible `/v1/chat/completions` request body.

## Methods

- `OpenAiChatBody.build(options)` returns the request body. Options (all
  optional except `messages`):
  - `model`: omitted when falsy (llama-server hosts one model).
  - `messages`
  - `temperature`: defaults to `OpenAiChatBody.DEFAULT_TEMPERATURE` (0.7).
  - `maxTokens`: sent as `max_tokens` only when a positive number.
  - `stream`: when true, also sends `stream_options: { include_usage: true }`.
  - `local`: the endpoint is a llama.cpp-family server we manage; adds
    `ANTI_REPETITION_SAMPLER` and `cache_prompt: true`.
  - `familySamplerDefaults`: the running model's published sampler.
  - `samplerOverrides`: per-request sampler overrides.
  - `tools`, `toolChoice` (default `'auto'`): sent only for a non-empty array.
  - `chatTemplateKwargs`: sent as `chat_template_kwargs` when non-empty.
  - `reasoningBudget`: sent as `reasoning_budget` for any number.
  - `promptCacheKey`, `promptCacheRetention` (default `'24h'`): retention is
    added only if `extra` did not already set `prompt_cache_retention`.
  - `extra`: caller pass-through fields, spread last.
- `OpenAiChatBody.ANTI_REPETITION_SAMPLER` is `{ repeat_penalty: 1.1, repeat_last_n: 256 }`.

Precedence, lowest to highest: house fields (temperature, local knobs),
`familySamplerDefaults`, `samplerOverrides`, `max_tokens`, `extra`.

## Why one builder

The managed llama-server is reached by two separate paths: the chat tab through
`OpenAICompatAdapter`, and everything else (extension slots, AgentRunner,
agent-manager, timed tasks) through `OpenAICompatibleProvider`.
They hand-wrote two different bodies for the same process, so quantized models
looped on an extension turn but not a chat turn, and the prompt cache was only
used on one path (bug H8). Both now build here. Every knob is optional and
`extra` exists because each path keeps its own extras.

## Why the local gate

`repeat_penalty`, `repeat_last_n` and `cache_prompt` are llama.cpp extensions.
api.openai.com and strict vLLM/Azure deployments reject unknown arguments with
HTTP 400, so they are only sent when `local` is set. `cache_prompt` matters
because some builds default it off, and then llama.cpp re-evaluates the whole
chat every turn.

## Why this sampler, and no DRY

llama.cpp's default sampler does nothing about verbatim loops
(`repeat_penalty` defaults to 1.0), and local quantized reasoning models fall
into them. A mild penalty over 256 tokens plus the streaming RepetitionMonitor
as a hard abort handles it.

DRY is deliberately absent. It matches sequences anywhere in the context,
tool results included, so an agent that must copy a long exact string it just
read (an ISBN, a URL, a SKU, a date) is penalised for typing it faithfully and
forced onto a wrong token. Observed with mangled dates at
`dry_allowed_length: 2` and mangled 13-digit ISBNs in repeated URLs even at
`dry_allowed_length: 8`. No allowed length is safe for verbatim extraction.

## Why the family sampler beats our temperature

The house temperature (0.7, or 0.2 on the agent path) is not a considered
choice for any particular model; the family figure comes from whoever trained
it. Callers needing a specific sampler use `samplerOverrides`, which still
wins, so determinism-critical paths keep temperature 0.

## Thinking controls

llama-server honours `chat_template_kwargs` and `reasoning_budget` per request.
A top-level `enable_thinking` is not read, which is why naive attempts to
disable thinking silently keep the model thinking. Other servers ignore the
unknown fields.
