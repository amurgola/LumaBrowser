# LoraApplier

`extensions/lora-trainer/LoraApplier.js`

Attaches a library LoRA to an installed model.

## Methods

- `apply({ loraName, modelRef, weight, remove })` -> `{ lora, model, weight, trigger, attached }`.
  The target is the named model, else the model the LoRA was trained for, else the
  generation default. The model's other LoRAs are kept; `remove` takes this one out.
- Static `merged`, `weight` (0.05 to 2, default 1), `presetOf`.

## Rules

- A trained LoRA (it has a sidecar) fits only a model whose recipe is the one it was
  trained with, so a klein 4B LoRA is refused on klein 9B.
- Any other LoRA fits by the families its header shows; one of unknown base is let through.
- A model running on a speed LoRA's recipe keeps that recipe: it is passed back to
  ModelLoraAttacher, which would otherwise restore the model's own steps and CFG.
