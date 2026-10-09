# CuratedModelCatalog

`core/llm-server/models/CuratedModelCatalog.js` (data: `CuratedModelCatalog.json`)

The curated GGUF "staff picks" the onboarding wizard and auto-planner recommend
from, with their HuggingFace download URLs.

## Methods

- `CuratedModelCatalog.MODELS` is the model list. Each model: `id`, `label`,
  `blurb`, `repo`, `fileBase`, `paramsB` (total params in billions, also for
  MoE), `maxContext`, `useCases`, `tier` (`small|mid|large|xl`), optional
  `moe: { activeParamsB }`, and `variants` keyed by quant with `approxBytes`
  and `minVramBytes`.
- `CuratedModelCatalog.QUANT_ORDER` is `['Q4_K_M', 'Q6_K', 'Q8_0']`.
- `CuratedModelCatalog.GB` is 1024^3.
- `CuratedModelCatalog.resolveUrl(model, quant)` returns `{ file, url }`, the
  public direct-download URL (no auth for public repos).
- `CuratedModelCatalog.listCatalog()` returns the flattened renderer shape:
  model fields without `fileBase`/`moe`, `variants` as an array in
  `QUANT_ORDER` with sizes, file and URL.

## Why it looks like this

The JSON holds sizes in GiB (`approxGb`, `minVramGb`) so the table stays
readable; the class converts to bytes. The array is shaped so it can later be
sourced from a remote-hosted JSON without touching callers.

`approxBytes` are the real bartowski file sizes and `minVramBytes` adds
headroom for KV and runtime at a modest 8K context. Both are estimates for
tiering and the pre-download display only: the real size comes from
Content-Length at download time, and real VRAM fit is the fit tester's job.

The repos are bartowski quants because the layout is predictable
(`<fileBase>-<QUANT>.gguf`, single file even at 30B+). bartowski prefixes the
file with the source author, so `fileBase` must match the on-repo name exactly
(for example `google_gemma-4-31B-it`).

`moe.activeParamsB` lets the automatic-setup planner prefer MoE models for CPU
and expert-offload tiers and reason about decode speed, which tracks active
parameters, not total.
