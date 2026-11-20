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
- Any other LoRA fits by the families the library reports (its CivitAI listing's base, else
  its header); one of unknown base is let through.
- `trigger` in the answer is the row's trigger words, so a CivitAI LoRA's reach the chat
  model the same way a trained LoRA's word does.
- A model running on a speed LoRA's recipe keeps that recipe: it is passed back to
  ModelLoraAttacher, which would otherwise restore the model's own steps and CFG.
