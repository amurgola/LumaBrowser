# ImageTrainingRegistry

`core/image-server/models/ImageTrainingRegistry.js`

Holds the LoRA training recipes a trainer add-on contributes, so Image Setup can tag
the models a LoRA can be trained for.

## Methods

Inherited from [ContributionRegistry](../../shared/registry/ContributionRegistry.md):
`register(recipe, extensionId)`, `unregister(id)`, `unregisterByExtension(extensionId)`,
`list()`, `getById(id)`. Errors carry the prefix `imageTraining.register`.

Own members:

- `ImageTrainingRegistry.shared`: the one instance the image server and ExtensionManager use.
- `recipeFor(model)`: the first recipe covering `{ id, family }`, or null.
- `ImageTrainingRegistry.matches(recipe, model)`: `modelIds`, when present, decides alone
  (FLUX.2 klein 4B but not 9B); otherwise the model's family must be in `families` and its
  id not in `excludeModelIds`. A model without an id never matches.
- A recipe must name `families` or `modelIds`.

Recipe shape: `{ id, label, families: [...], modelIds?, excludeModelIds?, trainer? }`.

## Why

Core owns the Image Setup rows, the add-on owns the knowledge of what is trainable. The
registry is the seam between them, shaped like [ImageCatalogRegistry](ImageCatalogRegistry.md).
