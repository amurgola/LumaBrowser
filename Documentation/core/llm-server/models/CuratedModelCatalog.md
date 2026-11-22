# CuratedModelCatalog

`core/llm-server/models/CuratedModelCatalog.js` (data: `CuratedModelCatalog.json`)

The curated GGUF "staff picks" the onboarding wizard and auto-planner recommend
from, with their HuggingFace download URLs.

## Methods

- `CuratedModelCatalog.MODELS` is the model list. Each model: `id`, `label`,
  `blurb`, `repo`, `fileBase`, `paramsB` (total params in billions, also for
  MoE), `maxContext`, `useCases`, `tier` (`small|mid|large|xl`, the capability
  rank the planners sort by, see below), optional `moe: { activeParamsB }`, and
  `variants` keyed by quant with `approxBytes` and `minVramBytes`.
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
(`<fileBase>-<QUANT>.gguf`, single file even at 30B+). Older bartowski repos
prefix the file with the source author (`Qwen_Qwen3.5-9B`,
`google_gemma-4-26B-A4B-it`); since mid 2026 first-party models are published
without one (`Qwen3.8-27B`). `fileBase` must match the on-repo name exactly, so
read it from the repo, never derive it.

`tier` is a capability rank, not a size class. Both planners offer the highest
tier that fits and use parameters only to order models inside a tier, so the
tier decides which model a machine is given. Set it from independent benchmark
standing: the 27B dense model is `xl` and the larger 35B sparse model `large`
because the 27B out-scores it by about 15 points.

`moe.activeParamsB` lets the automatic-setup planner prefer MoE models for CPU
and expert-offload tiers and reason about decode speed, which tracks active
parameters, not total.

## Current picks (reviewed 2026-11-22)

| Row | Tier | Where it is offered |
| --- | --- | --- |
| Qwen 3.5 4B | small | The floor: CPU-only laptops and cards of 8 GB or less |
| Qwen 3.5 9B | mid | 12 and 16 GB cards, CPU-only with 16 GB of RAM |
| Gemma 4 26B A4B | large | Sparse: experts in system RAM beside a small card, CPU-only with 32 GB |
| Qwen 3.6 35B A3B | large | Sparse: the same roles with 64 GB of RAM or more, and the speed pick |
| Qwen 3.8 27B | xl | Any machine with 24 GB of video memory or more |

Sources read for this review:

- llmrun, "Best local LLMs, November 2026" and its open-model Score table
  (llmrun.dev/learn/best-local-llms-2026-11): Qwen3.8 27B 121.9, Qwen3.6 35B A3B
  106.8, Gemma 4 31B 106.3, Gemma 4 26B A4B 105.8, Qwen3.5 9B 99.4, Qwen3.5 4B
  98.5; the 27B is its pick from 24 GB up, the 9B below, the 4B a tie with the 9B.
- TecAdmin, "Best Local LLMs for 8GB, 12GB, 16GB and 24GB GPUs"
  (tecadmin.net/best-local-llms-by-gpu-vram): Qwen3.5 4B at 8 GB, Qwen3.5 9B at
  12 GB, Qwen3.8 27B at 24 GB.
- PromptQuorum, "Best Local LLMs 2026"
  (promptquorum.com/local-llms/best-local-llms-2026): Qwen3.8 27B first overall,
  Gemma 4 26B A4B second, Qwen3.6 35B A3B below 24 GB.
- Artificial Analysis open-weights comparison (artificialanalysis.ai/models/open-source):
  Qwen3.8 27B is the only model under 40B among the leading open models.

What changed: Qwen 3.8 27B replaced Qwen 3.6 27B (same size, about 11 points
higher). Qwen 3.5 4B and 9B replaced Gemma 4 E2B and E4B, which no source ranks
above them at the same size. Gemma 4 31B was dropped: it is larger than the 27B
and scores about 15 points lower, so no machine should be given it. Alibaba has
published no small or sparse Qwen 3.8, which is why the smaller rows stay on 3.5
and 3.6.

To refresh: read each repo's real file sizes, parameter count and context from
the Hub, update the JSON, then run `node scripts/verify-model-catalogs.js` to
HEAD every download URL.
