# HfGgufRepo

`core/llm-server/models/HfGgufRepo.js`

Describes one GGUF repo on the HuggingFace Hub without downloading weights:
header facts, every quant variant, and the companion files beside them.

## Methods

- `HfGgufRepo.fetchVariants(repoId, { signal, revision })` returns `{ repoId,
  author, name, gated, paramsB, maxContext, architecture, chatTemplate,
  revision, variants }` where each variant is `{ quant, file, url, approxBytes,
  sha256, sharded, partUrls, parts }`: `url` and `partUrls` read the commit
  [HfPinnedRepo](HfPinnedRepo.md) pinned (`revision` is its description),
  `sha256` is the LFS digest of a single-file variant (null when sharded or
  unknown), and `parts` (sharded only) is `[{ url, file, size, sha256 }]` in
  shard order beside the `partUrls` the UI already reads. Throws `HF_BAD_ID`
  for a malformed id, `HF_NOT_FOUND` ("No such model: <id>") when the model
  page is missing, and the `HF_ACCESS_DENIED` access error for a gated repo.
  Unknown header facts are `null`.
- `HfGgufRepo.fetchCompanions(repoId, { signal, revision })` returns
  `{ mmprojs, mtps }`: vision projectors `{ file, path, url, approxBytes,
  sha256, precision }` and detached MTP heads `{ file, path, url, approxBytes,
  sha256, quant }`. With a 40-hex `revision` (the sha the weights were pinned
  to) the tree at that commit is read directly; otherwise the branch is
  resolved first. Never throws; any failure returns empty lists.
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
