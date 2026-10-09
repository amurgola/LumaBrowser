# ModelSidecars

`core/llm-server/scanner/ModelSidecars.js`

Finds the metadata files that accompany model weights.

## Methods

- `ModelSidecars.attach(models)` (async) sets each model's `sidecars`, reading
  each directory once.
- `ModelSidecars.listCandidates(dir)` non-`.gguf` file names, `[]` when unreadable.
- `ModelSidecars.forModel(model, names)` `[{ path, name, kind }]`:
  `common-config` for `COMMON_BASENAMES` (config.json, tokenizer files,
  Modelfile, params.json, ...), `basename-match` for `<model name>.<json|yaml|yml|txt|toml>`
  (case-insensitive).
- `COMMON_BASENAMES`, `STEM_EXTENSIONS`.

## Why

The UI shows whether a model has bundled metadata or is a bare weight file.
