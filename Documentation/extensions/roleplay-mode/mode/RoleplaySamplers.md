# RoleplaySamplers

`extensions/roleplay-mode/mode/RoleplaySamplers.js`

The sampler overrides a roleplay turn asks the local server for: DRY
(`dry_multiplier` 0.8, `dry_base` 1.75, `dry_allowed_length` 2) against looping
phrases and `min_p` 0.02. XTC (`xtc_threshold` 0.1, `xtc_probability` 0.5) was
part of the set until 2026-11-12: it made no measurable difference on two models
and caused runaway replies on a third (Omega-Evolution 27B, 0 of 8 without it
against 3 of 8 with it), so it is no longer sent. llama-server keys; the router
forwards them on the local path only. The DRY window (`dry_penalty_last_n`) is
not sent: the server default already means the whole context, and the
OpenAI-compatible route of the luma runtime (build 11731) validates the key as
non-negative, so the explicit `-1` it used to carry failed every roleplay turn
with "Value must be between 0 <= value <= 2147483647" (found 2026-11-04 by
`npm run rp:text`).

## Methods

- `RoleplaySamplers.forTurn(data)` a fresh copy of `LOCAL`, or null when the
  setup set `options.noSamplers`.

## Reply token cap (2026-11-12)

`replyCap(wordCap)` is the most tokens one narrator reply may generate: four
tokens a word of its ceiling plus `REASONING_ROOM` (1536) for a reasoning
model's thinking. The mode descriptor sends it as `max_tokens` with the
samplers, also when the anti-repetition samplers are off. Without a cap a
reply that came apart kept generating until the context was full.
