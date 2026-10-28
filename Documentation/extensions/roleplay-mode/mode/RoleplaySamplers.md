# RoleplaySamplers

`extensions/roleplay-mode/mode/RoleplaySamplers.js`

The sampler overrides a roleplay turn asks the local server for: DRY
(`dry_multiplier` 0.8, `dry_base` 1.75, `dry_allowed_length` 2) against looping
phrases, XTC (`xtc_threshold` 0.1, `xtc_probability` 0.5) against the most
probable and most clichéd token, and `min_p` 0.02. llama-server keys; the router
forwards them on the local path only.

## Methods

- `RoleplaySamplers.forTurn(data)` a fresh copy of `LOCAL`, or null when the
  setup set `options.noSamplers`.
