# HfRepoBrowser

`core/llm-server/ipc/HfRepoBrowser.js`

The wizard's live model browser over the Hugging Face Hub. Metadata only.

## Methods

- `new HfRepoBrowser({ wizard, search?, gguf?, mlx?, readme?, liveCatalog?, curated? })`
  (defaults `HfModelSearch`, `HfGgufRepo`, `HfMlxRepo`, `HfReadme`, `LiveCatalog.shared`,
  `CuratedModelCatalog.MODELS`).
- `search({ query, sort, limit, mlx })` `{ results }` (`mlx` coerced to boolean).
- `catalogLive({ force })` `{ models, source, errors }`.
- `expand(repoId, { mlx })` `{ info, hardware }`. GGUF: the repo's variants, each with
  a `FitClassifier` badge (paramsB from the repo, MoE active parameters from a
  curated repo of the same id); MLX: one synthetic variant `{ quant, file: owner__repo,
  approxBytes, sharded: false, mlx: true, repoId, fit }` with an `MlxFitClassifier`
  badge. No hardware (probe failed) means `fit: null`. A failure rethrows with
  `code` (or null).
- `readme(repoId)` `{ readme }` (null for no card); a failure rethrows with `code`.

## Why

The Hub's GGUF summary has no expert counts, so a MoE repo would be predicted as
dense (slower than it is). An MLX repo is one logical model, downloaded whole.
