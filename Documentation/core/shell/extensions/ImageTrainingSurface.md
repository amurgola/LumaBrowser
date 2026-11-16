# ImageTrainingSurface

`core/shell/extensions/ImageTrainingSurface.js`

`context.imageTraining`: lets a trainer extension declare which image models it can
train a LoRA for.

## Methods

- `new ImageTrainingSurface({ registry = ImageTrainingRegistry.shared })`; `key` is `imageTraining`.
- `forExtension(id)` -> `{ register(recipe), unregister(recipeId), list(), recipeFor(model) }`;
  recipes are owned by the extension and removed by [ExtensionTeardown](ExtensionTeardown.md).

See [ImageTrainingRegistry](../../image-server/models/ImageTrainingRegistry.md) for the recipe shape.
