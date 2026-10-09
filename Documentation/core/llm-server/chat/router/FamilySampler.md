# FamilySampler

`core/llm-server/chat/router/FamilySampler.js`

The model family's published sampler to send with one local request.

## Methods

All static.

- `forTurn(plan, extra)`: null without `plan.familySamplerDefaults`. Without `extra.pinTemperature` the whole published sampler. With it: the sampler minus `temperature`, minus any penalty at its no-op value (`repeat_penalty <= 1`, `presence_penalty` / `frequency_penalty` 0) unless the family is `penaltyHostile`; null when nothing is left. Never mutates the plan.
- `PENALTY_KEYS`.

## Why

A family's temperature and its penalties-off are one recipe (qwen38 turns the penalty off BECAUSE it samples at 1.0). A pinned-cold agent loop that kept the penalty off had nothing between it and a verbatim `<think>` loop, so the house anti-repetition floor must show through. Muse Glimmer's penalty-off protects its channel markers at any temperature, hence `penaltyHostile`.
