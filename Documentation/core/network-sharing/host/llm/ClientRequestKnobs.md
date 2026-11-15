# ClientRequestKnobs

`core/network-sharing/host/llm/ClientRequestKnobs.js`

Reads the sampling and length fields a shared client sent with a chat turn and
hands them to the host's dispatcher in the shape its own local path uses.

## Methods

- `ClientRequestKnobs.of(body)`: `{ maxTokens?, samplerOverrides?, pinTemperature? }`.
  `maxTokens` from a positive numeric `max_tokens` (or `max_completion_tokens`),
  floored. `samplerOverrides` holds the finite numbers among `SAMPLER_KEYS`
  (`top_p`, `top_k`, `min_p`, `typical_p`, the repeat, presence and frequency
  penalties, `repeat_last_n`, the four `dry_*` fields, `xtc_probability`,
  `xtc_threshold`, `reasoning_budget_tokens`). `pinTemperature` only for
  `luma_pin_temperature === true`. Anything else in the body is not forwarded.
- `ClientRequestKnobs.apply(extra, body)`: `extra` with those fields added, or
  the same object (null included) when the body carries none.

## Why

A paired client runs its chat modes itself and only borrows the host's model.
The roleplay mode asks for a reply cap, DRY and min-p, a thinking budget, and a
fixed 0.2 for its bookkeeping calls; on its own server those ride the local
request. The host's handler read only the temperature and the thinking knobs,
so a shared story decoded with no cap at all (`n_predict -1`) and every
bookkeeping call ran at the model family's published temperature. With the pin
the host's [FamilySampler](../../../llm-server/chat/router/FamilySampler.md)
keeps the caller's temperature, as it does for a local side call.

The client half is [RemoteStream](../../../llm-server/chat/router/RemoteStream.md) (`_peerOptions`).
