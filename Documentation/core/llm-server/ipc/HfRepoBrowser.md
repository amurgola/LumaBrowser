# HfRepoBrowser

`core/llm-server/ipc/HfRepoBrowser.js`

The wizard's live model browser over the Hugging Face Hub. Metadata only. Searches, expansions, cards and the hardware budget are remembered for minutes, so a second look (or a hover prefetch followed by the click) costs no second probe or request.

## Methods

- `new HfRepoBrowser({ wizard, search?, gguf?, mlx?, readme?, filter?, liveCatalog?, curated?, now? })`
  (defaults `HfModelSearch`, `HfGgufRepo`, `HfMlxRepo`, `HfReadme`, `HfModelFilter`, `LiveCatalog.shared`,
  `CuratedModelCatalog.MODELS`, `Date.now`).
- `search({ query, sort, limit, mlx, fit })` `{ results, hidden: { notChat, tooBig } }`. GGUF mode fetches
  `OVERFETCH` (2) times the limit, runs [HfModelFilter](../models/HfModelFilter.md) with the hardware
  (dropping non-chat repos, badging each row with a Q4 fit, and with `fit` dropping too-big rows) and trims to
  the limit; MLX mode passes the rows through (no GGUF facts). Remembered per argument set for
  `SEARCH_TTL_MS` (5 minutes).
- `hardware()` the wizard's budget, probed at most once per `HARDWARE_TTL_MS` (1 minute); null when the probe fails.
- `catalogLive({ force })` `{ models, source, errors }`.
- `expand(repoId, { mlx })` `{ info, hardware }`. GGUF: the repo's variants, each with
  a `FitClassifier` badge (paramsB from the repo, MoE active parameters from a
  curated repo of the same id); MLX: one synthetic variant `{ quant, file: owner__repo,
  approxBytes, sharded: false, mlx: true, repoId, fit }` with an `MlxFitClassifier`
  badge. No hardware (probe failed) means `fit: null`. A failure rethrows with
  `code` (or null) and is not remembered. Remembered per repo and mode for `REPO_TTL_MS` (10 minutes).
- `readme(repoId)` `{ readme }` (null for no card); a failure rethrows with `code`. Remembered like `expand`.

## Why

The Hub's GGUF summary has no expert counts, so a MoE repo would be predicted as
dense (slower than it is). An MLX repo is one logical model, downloaded whole.
The hardware probe spawns nvidia-smi and took seconds on every click of a result;
the budget does not change between two clicks, so one probe per minute (from the
service's diagnostics snapshot through [ModelWizard](ModelWizard.md)) serves them all.
Caches are [PromiseTtlCache](../../shared/cache/PromiseTtlCache.md) instances.
