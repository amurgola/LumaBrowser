# GroupIntent

`core/llm-server/chat/bridge/groups/GroupIntent.js`

Infers from a user message which lazy tool groups the turn plainly needs.

## Methods (all static)

- `infer(text, availableKeys)`: the keys of `PATTERNS` (in table order) that
  are in `availableKeys` and match the text; `[]` for blank text.
- `PATTERNS`: `live_artifacts`, `images`, `artifacts`, `web`,
  `knowledge_base`, `tool_forge` regexes. Never `code_validation`.

## Why

Recall-leaning: a false positive costs a few prompt lines, a false negative a
malformed call and a bounce.
