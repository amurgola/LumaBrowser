# TrainableModels

`extensions/lora-trainer/TrainableModels.js`

Resolves installed image models against the recipes.

## Methods

- `trainable()` -> `[{ model, recipe }]` for every installed model a recipe covers.
- `find(ref)`: by id, then by label (case-insensitive); the generation default when `ref`
  is empty. Throws when nothing matches.
- `trainingTarget(ref)` -> `{ model, recipe, basePath }`; throws when the family has no
  recipe (with the reason) or an installed-file recipe finds no `.safetensors` / `.ckpt`
  checkpoint (a GGUF cannot be trained on).
- `recipeOf(model)`; `TrainableModels.basePath(model, recipe)`.
