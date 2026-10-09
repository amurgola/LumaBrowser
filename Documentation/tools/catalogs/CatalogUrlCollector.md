# CatalogUrlCollector

`tools/catalogs/CatalogUrlCollector.js`

Collects every download URL in the curated catalogs as `{ catalog, model, file, url }` rows.

## Methods

- `CatalogUrlCollector.collect({ llm?, image?, music? })`: each argument has `list()`; defaults are
  `CuratedModelCatalog.listCatalog()`, `new ImageModelCatalog()` and `new MusicModelCatalog()`. Rows: every LLM
  variant; every image `files` entry with a `url` and each of its `quants` with a `url` (model shown as
  `id (quant)`); one row per music model for `https://huggingface.co/<hfRepo>/resolve/main/config.json` (a music
  model is a repo snapshot with no single file, so config.json resolving proves the repo exists and is public).

Run in plain Node, the image catalog holds the shipped rows only (extension rows join once extensions activate).
