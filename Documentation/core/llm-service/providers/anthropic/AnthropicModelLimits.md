# AnthropicModelLimits

`core/llm-service/providers/anthropic/AnthropicModelLimits.js`

Per-model facts the Messages API enforces.

## Methods

- `outputCeilingFor(modelId)`: a learned ceiling if any, else 128000 for the
  5 family (fable, mythos, opus, sonnet) and opus/sonnet 4.6 to 4.9, 64000 for
  the 4.5 family, else `DEFAULT_MAX_TOKENS` (32000).
- `learnCeiling(modelId, ceiling)`; `ceilingFromRejection(message)` reads M
  from `"max_tokens: N > M, ..."` or returns null.
- `resolveMaxTokens(options, modelId)`: `options.max_tokens` floored and
  clamped to the ceiling when it is a positive number, else the ceiling.
- `takesAdaptiveThinking(modelId)`: true for the 5 family and 4.6+.

## Why

32000 is the floor: the lowest ceiling among the Claude models still served,
so it is never rejected. A single 32k cap broke a long tool call on
claude-opus-5, which thinks by default and spends thinking from the same
budget, so known models get their own ceiling (verified 2026-08-25). A large
ceiling costs nothing on a short streamed answer.

Learned ceilings are process-wide because the chat tab builds a throw-away
provider per turn; an instance field would forget them immediately.
