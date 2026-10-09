# NoThinkDirective

`core/llm-service/NoThinkDirective.js`

Appends a plain-English "do not think" instruction and the `/no_think`
directive to the last user turn for Qwen-family models.

## Methods

- `NoThinkDirective.apply(modelId, messages)` returns a new messages array
  with `NoThinkDirective.SUFFIX` appended to the last user message (to its last
  text part for multi-part content, or as a new text part when there is none).
  Returns the input unchanged for non-Qwen models, an already-marked message,
  no user message, or empty input. Never mutates the input.
- `NoThinkDirective.SUFFIX`.

## Why

Some Qwen templates ignore the request-body toggle; the instruction survives
any template and relies only on prompt following, and `/no_think` is honoured
by older Qwen3 templates. Directives must live in the newest user turn to
affect the response to it. Idempotent: a message already carrying
`/no_think`, `/nothink` or the instruction is left alone.

Pass a bare model id: the `::` in a provider-prefixed ref defeats the family
regex. [ThinkingOff](ThinkingOff.md)`.resolve` strips it for you.
