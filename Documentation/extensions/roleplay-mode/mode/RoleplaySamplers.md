# RoleplaySamplers

`extensions/roleplay-mode/mode/RoleplaySamplers.js`

The sampler overrides a roleplay turn asks the local server for: DRY
(`dry_multiplier` 0.8, `dry_base` 1.75, `dry_allowed_length` 2) against looping
phrases, XTC (`xtc_threshold` 0.1, `xtc_probability` 0.5) against the most
probable and most clichéd token, and `min_p` 0.02. llama-server keys; the router
forwards them on the local path only. The DRY window (`dry_penalty_last_n`) is
not sent: the server default already means the whole context, and the
OpenAI-compatible route of the luma runtime (build 11731) validates the key as
non-negative, so the explicit `-1` it used to carry failed every roleplay turn
with "Value must be between 0 <= value <= 2147483647" (found 2026-11-04 by
`npm run rp:text`).

## Methods

- `RoleplaySamplers.forTurn(data)` a fresh copy of `LOCAL`, or null when the
  setup set `options.noSamplers`.
