# TriggerMemoryPolicy

`core/llm-server/chat/trigger-store/TriggerMemoryPolicy.js`

A trigger's persistent-memory policy. Extends [TriggerPolicy](TriggerPolicy.md).

## Methods

- `normalize(memory)`: `true` or `{ runs?, maxChars? }` gives
  `{ runs (0 .. 20, default 5), maxChars (200 .. 16000, default 4000) }`;
  falsy gives `null` (off).
- `normalizeInto(source, out)`: stores `memory` when on.
- `of(trigger)`: the policy in force, or `null`.
- `capNotes(trigger, text)`: trimmed notes cut to the policy's `maxChars` (or
  `DEFAULT_CHARS` when memory is off), the last character an ellipsis.
- Constants `DEFAULT_RUNS`, `MAX_RUNS`, `DEFAULT_CHARS`, `MIN_CHARS`, `MAX_CHARS`.

## Why

`runs` is how many earlier runs a run is shown; `maxChars` bounds the notes
the model keeps. Turning memory off drops the policy, not the notes.
