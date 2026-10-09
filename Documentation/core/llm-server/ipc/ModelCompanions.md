# ModelCompanions

`core/llm-server/ipc/ModelCompanions.js`

The companion GGUFs a repo ships beside the weights.

## Methods

- `new ModelCompanions({ gguf? })` (default `HfGgufRepo`).
- `resolve(url, file)` resolves `{ repoId, mmproj, mtp, downloads }`: for a Hub URL,
  the best projector (`GgufCompanionPicker.bestMmproj`) and the draft head matching
  the weights' quant (`bestMtp` with `GgufFileName.quantOf(file)`); `downloads` lists
  them in fetch order as `{ ...file, kind: 'mmproj' | 'mtp', label: 'vision projector' | 'draft head' }`.
  A non-Hub URL or a failed lookup has none.

## Why

Without the projector a VL model is text-only; without a detached MTP head
speculative decoding has nothing to draft from (about half speed). The scanner
pairs companions with every weight group in a folder, so a download with any goes
into its own per-repo folder.
