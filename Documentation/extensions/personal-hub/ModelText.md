# ModelText

`extensions/personal-hub/ModelText.js`

Reading what a model wrote back to the Hub: the JSON object inside a reply
that may carry reasoning or a code fence around it, and text cut to one
bounded line. Shared by the two prompts that ask a model for JSON,
[SummaryPrompt](summary/SummaryPrompt.md) and
[ContactProfilePrompt](contacts/ContactProfilePrompt.md).

## Methods (static)

- `json(text)` -> the parsed object, or `null`. `<think>...</think>`
  sections are dropped first (any case). Then, from each `{` in turn, the
  span up to the last `}` of the reply is tried with `JSON.parse`; the first
  that parses is returned. `null` when none does, or for empty text.
- `clip(value, max)` -> one line: whitespace runs become single spaces and
  the ends are trimmed (`null` and `undefined` are `''`). Longer than `max`,
  it is cut to `max - 3` characters, trailing space trimmed, and ends in
  `...`.

## Why

A thinking model may reason before it answers, and some models wrap the
object in a code fence, so a reply is rarely bare JSON. Both prompts read
replies the same way, so the reading lives in one place.
