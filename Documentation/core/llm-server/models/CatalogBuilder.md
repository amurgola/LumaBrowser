# CatalogBuilder

`core/llm-server/models/CatalogBuilder.js`

Builds the curated model catalog from HuggingFace repo ids. Humans curate which
repos are staff picks; the Hub API supplies param count, max context, per-quant
sizes and URLs, so the data never drifts. Output is the
[CuratedModelCatalog](CuratedModelCatalog.md)`.listCatalog()` row shape. Cached
serving lives in [LiveCatalog](LiveCatalog.md).

## Methods

- `new CatalogBuilder({ fetchVariants })`; `fetchVariants(repoId, { signal })`
  defaults to [HfGgufRepo](HfGgufRepo.md)`.fetchVariants`.
- `build(repos = CURATED_REPOS, { signal })` resolves `{ models, errors }`;
  failing repos land in `errors` as `{ id, repo, error }`, never throw.
- `buildEntry(spec, { signal })` resolves `{ id, label, blurb, repo, paramsB, maxContext, useCases, tier, variants }`
  or `{ _error, id, repo }` (fetch failure, or "No curated quants present in repo").
  `spec`: `{ repo, id?, label?, blurb?, useCases?, tier?, quants? }`; defaults are the
  repo id, `labelFromRepo`, `"<arch> model · <n>B params."`, all three use cases
  and `tierFor`. `paramsB` is rounded to a tenth (0 when unknown); each variant is
  `{ quant, approxBytes, minVramBytes, file, url, sharded }` in whitelist order.
- `CatalogBuilder.tierFor(paramsB)` `<6` small, `<12` mid, `<30` large, else xl.
- `CatalogBuilder.minVramFor(approxBytes, paramsB)` rounded
  `weights + FitVramMath.kvBytesAt8k + GPU_OVERHEAD`, the fit badge's estimate.
- `CatalogBuilder.labelFromRepo(repoId)` drops the `GGUF` suffix, underscores to spaces.
- `CatalogBuilder.DEFAULT_QUANTS` `['Q4_K_M', 'Q6_K', 'Q8_0']`; `CURATED_REPOS`.

## Why

`CURATED_REPOS` is derived from `CuratedModelCatalog.MODELS` (id, repo, label,
blurb, use cases) instead of a second hand-typed copy: the legacy list was
identical except for its em-dashes. Tier is not copied, so live data still decides it.
