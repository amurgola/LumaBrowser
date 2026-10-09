# TriggerFilter

`core/llm-server/chat/triggers/TriggerFilter.js`

The filter gate of a trigger: `{ "<dotted.path>": matcher }` rules evaluated
against an event before it costs a model turn. Used by
[TriggerGating](TriggerGating.md).

## Methods

- `TriggerFilter.getPath(obj, dottedPath)` reads `a.b.c` (or `a.0.b` into
  arrays). `undefined` as soon as a step is missing or not an object; an empty
  path returns `obj`.
- `TriggerFilter.normalize(filter)` trims keys, drops empty keys and
  `undefined` matchers, keeps at most `MAX_RULES` (20). Returns `null` when the
  filter is empty or not a plain object.
- `TriggerFilter.evaluate(filter, event)` returns `{ pass, failed: [path] }`.
  Every rule must hold. An absent or empty filter passes.
- `TriggerFilter.MAX_RULES`.

## Rules

Matchers are [ExpectationMatcher](../../eval/ExpectationMatcher.md) matchers
(bare value, `exists`, `regex`, `equals`, `contains`, `oneOf`, `gte`/`lte`), so
a rule means the same thing in an eval task and in a trigger.

A path that does not exist in the event matches only `{ exists: false }`. Any
other matcher fails on a missing path, so `{ "body.bot_id": "x" }` never
accidentally passes an event without that field.
