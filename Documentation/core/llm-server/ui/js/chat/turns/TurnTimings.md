# TurnTimings

`core/llm-server/ui/js/chat/turns/TurnTimings.js`

Normalises llama.cpp's per-turn timings into prompt and generation tok/s (one
decimal; derived from counts and times when the precomputed rates are missing)
and builds the action row's speed pill with the counts in its tooltip.

## Methods

- `TurnTimings.normalize(timings)`: `null` when neither rate is usable.
- `TurnTimings.pillHtml(normalized)`.
