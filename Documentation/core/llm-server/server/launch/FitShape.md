# FitShape

`core/llm-server/server/launch/FitShape.js`

The shape of a launch as far as its VRAM footprint goes at one context and
KV mode. A fit test stores the shape it measured, and its peak is trusted
only for a launch of the same shape.

## Methods (static)

- `of(state, decision)` with `state: { flags, batch, spec, moe, kv }` and the
  priced [OffloadDecision](OffloadDecision.md): one string,
  `runtime <id>@<build>; window cache none|windowed|full; micro-batch <n>;
  draft none|drafter|mtp; experts gpu|cache|layers; kv gpu|host`. The window
  cache is the one the launch takes if it fully offloads (`flags.swaFull` and
  `decision.swaFullAffordable`), read before any measurement is applied, so a
  fit test and a later Start derive it the same way.
- `matches(measuredShape, shape)`: true only for a non-empty string equal to
  `shape`.

## Where it is used

- [OffloadDecision](OffloadDecision.md) sets `decision.fitShape` and, when the
  overrides carry `measuredShape` (every stored peak does;
  `null` for a row from before shapes were recorded), drops the measured peak
  unless it matches: `measuredStale` is then true and the header estimate
  stands. A caller that passes `measuredVramBytes` with no `measuredShape` key
  at all vouches for the number itself.
- [PlanSummary](PlanSummary.md) exposes `fitShape` and `measuredStale`;
  [ServingNotes](ServingNotes.md) says when a stored fit test was set aside.
- [FitComboRunner](../fit-test/FitComboRunner.md) stores `plan.fitShape` on
  each row as `shape`; [FitRows](../../context/FitRows.md)`.measuredComboShape`
  reads it back for [LaunchOverrides](../launcher/LaunchOverrides.md),
  [RungEstimator](../../context/RungEstimator.md) and the fit test's own
  seeding.

## Why

A stored peak used to be trusted whatever launched. On 2026-11-20 two stored
peaks were checked against a real load on the same cards:

| model, context | stored peak | header estimate | real load |
|---|---|---|---|
| Qwen3.8-27B Q6, 32k | 27.20 GiB | 26.28 GiB | 25.98 GiB |
| Gemma-4-31B Q6, 64k | 31.53 GiB | 27.25 GiB | 28.65 GiB |

Both had been measured under an older runtime build, and the second with the
full-size window cache that today's launch at that size does not take. The
second one alone turned a model that fits the 5090 into a two-card split. The
shape names what changes a footprint besides the hardware, so a peak is
dropped exactly when one of those things changed, and kept across restarts,
other models and changes in what else occupies the cards.

Rows stored before this carry no shape and are set aside until the fit test
is run again; the Setup matrix still shows their measured numbers.
