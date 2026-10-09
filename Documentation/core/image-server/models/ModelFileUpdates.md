# ModelFileUpdates

`core/image-server/models/ModelFileUpdates.js`

Finds companion-file updates (for example a replaced VAE) for an installed
image model by comparing it against the catalog.

## Methods

- `ModelFileUpdates.findFileUpdates(model, catalog)` returns
  `[{ role, file, url, approxBytes, replaces, note, loaderFlag? }]`. `model` is a
  scanner record or manifest (`files[role].file`, or the older `name` key, is the
  installed basename); `catalog` is the catalog's `list()` output. Missing
  inputs give `[]`.
- `ModelFileUpdates.catalogSourceFor(model, catalog)` returns the catalog row
  the model takes updates from: its own row by id, else the first same-family
  row that ships any files, else `null`.

## Why

A catalog row can replace a companion file after people installed it (first
case: Qwen-Image 2.1's VAE swapped for madebyollin's texture-fix finetune three
days after the row shipped). The scanner does not touch installed manifests, so
without this an existing install would keep the old file forever.

A catalog file opts in with `supersedes: ['old.safetensors']` (plus optional
`updateNote`), and only an installed basename in that list is reported. A quant
the user picked, a companion an import hardlinked, or a hand-swapped file never
shows a phantom update. Imports are matched through their family because that
is how their companions were resolved (hardlinked from the catalog row by name).
`loaderFlag` is carried so the manifest rewrite keeps the flag the catalog wants.
