# DrafterCatalog

`core/llm-server/models/DrafterCatalog.js`

The recommended speculative drafters, per target model family: the Hub repo that
publishes a block drafter for the model, which quant to fetch, the engines that can
run it and what was measured. Data plus lookups; nothing here downloads.

## Entries

| id | family | target | repo | quant | block | engines |
|---|---|---|---|---|---|---|
| `qwen38-27b-dflash2` | `qwen38` | Qwen3.8-27B (`targetPattern` restricts the family to the dense 27B) | `z-lab/Qwen3.8-27B-DFlash2-GGUF` | Q8_0 (1.9 GB) | 8 | llama-cpp |
| `muse-glimmer-30b-dflash2` | `muse-glimmer` | Muse Glimmer 30B | `z-lab/Muse-Glimmer-30B-DFlash2-GGUF` | Q8_0 (2.8 GB) | 8 | llama-cpp |

Each entry also carries `label`, `approxBytes` (the Q8_0 size, for the offer line
before the repo is read), `blurb` (what was measured, or that nothing was), and
`licenseNote`. `ENGINE_RUNTIMES` maps the engine key to runtime id prefixes
(`llama-cpp-`, `ik-llama`).

## Methods

- `list()`, `getById(id)`, `forFamily(family)`.
- `entryFor(model)`: the entry for a scanned weights model (`kind: 'weights'`, role
  `main`): `ModelFamilies.detect` must name the entry's family AND the entry's
  `targetPattern` must match `ModelFamilies.nameHaystack(model)`. Companions and
  other sizes of the family get null.
- `entryForDownload(repoId, file)`: the same for a download that has no header yet,
  matched on `repoId + file`. A file whose name says it is a drafter or a projector
  gets null, so downloading the drafter's own repo never fetches it twice.
- `pickFile(entry, files)`: from a repo listing (`[{ path, size, sha256 }]`), the
  preferred quant, else the highest-precision quant at or under `MAX_QUANT_BITS`
  (8), else the smallest file; projectors and non-GGUF files never qualify.
- `engineSupported(entry, model)`: any of the model's `compatibleRuntimes` starts
  with one of the entry's engine prefixes; a model with no runtime list is taken as
  supported (the planner drops the flags at launch when the binary rejects them).
- `offerFor(model)`: `describe(entry)` plus `installed` (the scanner attached a
  drafter, or paired one the user switched off, `drafterAuto`) and `engineSupported`; null when no drafter is published for the model.
  This is what [LlmModelsView](../ipc/LlmModelsView.md) puts on every model as
  `drafterOffer`.
- `describe(entry)`: the entry without its regex, for the renderer.

## Why

A drafter lives in a repo of its own, so the per-repo companion download
([ModelCompanions](../ipc/ModelCompanions.md)) never saw it, and the user had to
know z-lab publishes one. The family profile ([ModelFamilyTable](../server/ModelFamilyTable.md))
already says how to launch with a drafter; this table says where to get it. The
quant rule mirrors [GgufCompanionPicker.bestMtp](GgufCompanionPicker.md): a drafter
is 2 GB against 20 to 30 GB of weights, so acceptance is worth more than bytes, but
BF16 doubles the size for the same acceptance.

Measured 2026-11-08 on an RTX 5090 (unsloth Qwen3.8-27B-UD-Q6_K_M, temperature 0):
DFlash2 Q8_0 140 tok/s at short context against 110 with the grafted MTP head and
58 plain; at 120k context 60 against 61 (MTP) and 40 (plain). Tencent's DSpine
(block 16) was measured too and lost on llama.cpp, so it is not listed.
