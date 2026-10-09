# ResponseText

`core/llm-service/ResponseText.js`

Reads the assistant's text out of a non-streaming LLM response, whatever the
provider shape.

## Methods

- `ResponseText.extract(response)` returns the trimmed text, or `''` when
  nothing is readable. Never null or undefined.

Shapes, in precedence order: a bare string; `choices[0].message.content` as a
string (an empty string is returned as is) or as text blocks;
`choices[0].text` (completion endpoints); Anthropic top-level `content` blocks;
`content` as a string; then `text`, `output`, `completion`. Whitespace-only
values fall through to the next shape.

## Why

Most legacy call sites read `choices?.[0]?.message?.content || ''`, which
silently yields `''` for an Anthropic-native response, a completion endpoint
or a wrapper returning content blocks. This is the one tolerant reader; it
lives in llm-service because it is generic LLM knowledge. It is not for
streaming deltas, which the providers parse themselves.
