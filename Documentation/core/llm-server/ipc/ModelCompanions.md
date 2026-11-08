# ModelCompanions

`core/llm-server/ipc/ModelCompanions.js`

The companion GGUFs a repo ships beside the weights, plus the catalog drafter for the
model's family from its own repo.

## Methods

- `new ModelCompanions({ gguf?, catalog?, pin? })` (defaults `HfGgufRepo`,
  `DrafterCatalog`, `HfPinnedRepo.pin`).
- `resolve(url, file, { revision? })` resolves `{ repoId, mmproj, mtp, drafter, downloads }`:
  for a Hub URL, the best projector (`GgufCompanionPicker.bestMmproj`) and the draft
  head matching the weights' quant (`bestMtp` with `GgufFileName.quantOf(file)`);
  then the drafter [DrafterCatalog](../models/DrafterCatalog.md)`.entryForDownload(repoId, file)`
  names, pinned at its repo's head and picked with `pickFile`, as
  `{ file, path, url, approxBytes, sha256, id, label, repo }`. `downloads` lists them
  in fetch order as `{ ...file, kind: 'mmproj' | 'mtp' | 'drafter', label }`
  (`vision projector`, `draft head`, `<label> drafter`). `revision` is the sha the
  weights were pinned to, passed to `HfGgufRepo.fetchCompanions` so the repo
  companions come from the same commit; the drafter repo is a different repo and is
  pinned on its own. A non-Hub URL or a failed lookup has no repo companions; a
  drafter repo that cannot be read has no drafter.

## Why

Without the projector a VL model is text-only; without a detached MTP head
speculative decoding has nothing to draft from (about half speed); with the
recommended drafter a Qwen3.8-27B decodes about 2.4x faster than plain. The scanner
pairs companions with every weight group in a folder, so a download with any goes
into its own per-repo folder, which is also where the drafter must sit to pair.
