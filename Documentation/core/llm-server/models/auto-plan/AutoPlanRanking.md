# AutoPlanRanking

`core/llm-server/models/auto-plan/AutoPlanRanking.js`

The ladders, headroom factors and ranking rules every
[AutoPlanner](../AutoPlanner.md) step shares.

## Methods

- Constants: `CTX_LADDER` `[32768, 16384, 8192]`, `KV_LADDER` `['f16', 'q8_0']`,
  `TIER_RANK` (`small` 0 .. `xl` 3), `MOE_RESIDENT_FRACTION` 0.15,
  `RAM_HEADROOM` 0.85, `CPU_RAM_HEADROOM` 0.8, `MIN_GPU_BUDGET` 1.5 GB, `GB`.
- `tierRankOf(model)` (unknown tier = 0); `tierOf(pick)` (-1 for no pick).
- `capableFirst(models)` tier then params, descending; `smallestFirst(models)`.
- `quantsBestFirst()` `QUANT_ORDER` reversed (`Q8_0` first).
- `modelScore(pick)` `tier x 1e6 + params x 1e3 + quantIndex x 10 + ctxRungBonus`, -1 for none.
- `vramNeedOf(pick)` GPU bytes a settled pick occupies: `vramNeedBytes` for
  `gpu`; `weights x 0.15 + KV + overhead` for `moe-cpu`; null for `cpu`/`partial`.
- `predictedTps(model, quant, hw)` plain-decode tok/s at 8K from
  [CatalogDecodeEstimator](../../server/decode/CatalogDecodeEstimator.md), or null.

## Why

The MoE resident fraction is a pre-download guess of the always-on share
(attention, norms, embeddings); [MoeEstimator](../MoeEstimator.md) refines it
from the real header once the file is local. It only has to rank candidates.
`vramNeedOf` is shared by the coexistence decision and the summary so the two
can never quote different numbers.
