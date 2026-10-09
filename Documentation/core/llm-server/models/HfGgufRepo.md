# HfGgufRepo

`core/llm-server/models/HfGgufRepo.js`

Describes one GGUF repo on the HuggingFace Hub without downloading weights:
header facts, every quant variant, and the companion files beside them.

## Methods

- `HfGgufRepo.fetchVariants(repoId, { signal })` returns `{ repoId, author,
  name, gated, paramsB, maxContext, architecture, chatTemplate, variants }`
  where each variant is `{ quant, file, url, approxBytes, sharded, partUrls }`
  (`partUrls` only when sharded). Throws `HF_BAD_ID` for a malformed id and
  `HF_NOT_FOUND` ("No such model: <id>") when the model page is unreadable.
  Unknown header facts are `null`.
- `HfGgufRepo.fetchCompanions(repoId, { signal })` returns `{ mmprojs, mtps }`:
  vision projectors `{ file, path, url, approxBytes, precision }` and detached
  MTP heads `{ file, path, url, approxBytes, quant }`. Never throws; any
  failure returns empty lists.
- `HfGgufRepo.fetchMmprojs(repoId, { signal })` returns just `mmprojs`.

## Why

`paramsB` comes from the header's `gguf.total` (raw parameter count / 1e9).
Variants come from [GgufVariantGrouper](GgufVariantGrouper.md).

Companions are the files the variant grouping skips but the downloader must
fetch for full capability: without a projector a VL model is text-only, and
without a detached MTP head `--spec-type draft-mtp` has nothing to draft from.
A companion is an enhancement, never a reason to fail a download, so lookups
degrade to empty lists. One tree fetch serves both kinds. Pick among them with
[GgufCompanionPicker](GgufCompanionPicker.md).
