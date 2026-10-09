# LoraModal

`core/llm-server/ui/js/image-setup/LoraModal.js`

"LoRAs / speed" for one installed image model: pick a LoRA from the shared library (annotated with its detected base), set its weight and the distilled speed preset, import one, or download a curated one; Save writes the manifest (None removes it). A Wan Lightning pair that the single picker cannot show is called out.

## Methods

- `open(modelId)`; `refreshLoras(selectName?)`; `checkPreset()`; `attached()` (close and refresh models). IPCs: `listLoras`, `importLora`, `setModelLoras`, plus the curated list's.

## Globals

None beyond ImageModal.
