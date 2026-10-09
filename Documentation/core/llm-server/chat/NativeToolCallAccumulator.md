# NativeToolCallAccumulator

`core/llm-server/chat/NativeToolCallAccumulator.js`

Reassembles streamed `delta.tool_calls` fragments into whole calls and detects a
completion stuck repeating one call.

## Methods

- `new NativeToolCallAccumulator()` starts empty; one per completion.
- `add(fragments)` folds one chunk's `tool_calls` array in, keyed by `index`
  (default 0): `id` and `function.name` are taken when present, and
  `function.arguments` pieces are concatenated. Non-arrays and null entries are
  ignored. Returns `this`.
- `finalize()` returns the dense list of calls that got a name:
  `[{ id, name, args }]`.
- `isLooping()` is true when the last three completed calls (every named slot
  except the last, which just opened) have the same name and arguments.
- `NativeToolCallAccumulator.LOOP_REPEATS` (3).

## Why

Per the OpenAI streaming shape, `function.name` arrives whole in a call's first
fragment and `function.arguments` dribbles in pieces.

The loop detector exists because one model, on an edit turn, emitted an empty
`edit_artifact` call and repeated it about 185 times in one completion until the
token cap cut it. The streaming repetition monitors never fire on that: tool-call
fragments stream on neither the content nor the reasoning channel. Watching the
arguments byte stream would be wrong, because a legitimate 10 KB HTML payload is
full of repeated markup. Whole identical calls are unambiguous; no model means
the same call three times in one completion.

Call `isLooping()` when a fragment carrying a function name arrives (a new slot
opened), because only then is every earlier slot complete.
