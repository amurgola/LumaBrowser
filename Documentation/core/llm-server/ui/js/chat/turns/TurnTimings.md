# TurnTimings

`core/llm-server/ui/js/chat/turns/TurnTimings.js`

Normalises llama.cpp's per-turn timings into prompt and generation tok/s (one
decimal; derived from counts and times when the precomputed rates are missing)
and builds the action row's speed pill with the counts in its tooltip.

## Methods

- `TurnTimings.normalize(timings)`: `null` when neither rate is usable.
- `TurnTimings.pillHtml(normalized)`.

## Speculation

`normalize(t, speculation)` also keeps llama.cpp's `draft_n` / `draft_n_accepted` as
`draftN` / `draftAccepted` and the done event's speculation
([LocalSpeculationInfo](../../../../chat/router/LocalSpeculationInfo.md)) as
`{ kind, label, specType, draftNMax }`. `speculationLines(t)` builds the extra tooltip
lines: `Speculative decoding: <label> (<specType>, up to N tokens per step)` and
`Drafted N tok, M accepted (P%)`, or `No drafted tokens reported for this turn` when a
branch ran but llama.cpp sent no counts. The pill text itself is unchanged.
