# LoraModal

`core/llm-server/ui/js/image-setup/LoraModal.js`

"LoRAs / speed" for one installed image model: the list of LoRAs attached to it, each with its own weight and a Remove button, a picker that adds another from the shared library, Import a file, Browse CivitAI, the curated downloads and the distilled speed preset. Save writes the whole list to the manifest; an empty list detaches everything.

## Methods

- `open(modelId)` reads the model's `defaults.loras` (every entry, a Wan pair's `highNoise` flag included) and its family, then loads the library and the curated list.
- `refreshLoras(addName?, weight?)` reloads the library (`listLoras`) and, with `addName`, attaches that LoRA at `weight` (1.0 when absent).
- `lorasWith(entries)` the current list with `entries` laid over it (same names replaced); the curated list saves a Wan pair through it so the model's other LoRAs stay.
- `checkPreset()`; `attached()` (close and refresh models). `LoraModal.weightOf(value)` a positive number, else 1.0.
- IPCs: `listLoras`, `importLora`, `setModelLoras`, plus the curated list's.

## Behaviour

- Each attached row shows the LoRA's listing label when it has one (a CivitAI install), else its file name, and under it the [LoraBaseNote](LoraBaseNote.md) for this model's family followed by its trigger words. A LoRA whose file left the library says so and is kept in the list.
- The picker offers the library LoRAs that are not attached yet in three groups: "For this model" (the LoRA's families include the model's), "Base not detected" and "Other architectures". A model without a family gets one flat list. Picking attaches at once; a mismatched LoRA can still be attached, with the note in the warning colour.
- Browse CivitAI opens [CivitaiModal](CivitaiModal.md) over this dialog with `{ type: 'LORA', family }`; the LoRAs added there are attached when it closes.
- Nothing is written until Save, which sends `{ id, loras: [{ name, weight, highNoise? }], distilledPreset }`.

## Globals

None beyond ImageModal.
