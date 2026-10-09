# ImageStep

`core/llm-server/ui/js/wizard/ImageStep.js`

Step 5, optional image generation. One fixed title across its views: ask (the quality-first model for this hardware via [ImageModelBudget](../setup/ImageModelBudget.md), the runtime via [ImageRuntimePicker](../setup/ImageRuntimePicker.md), checkpoints already in ComfyUI / Forge / SD WebUI first), progress with Cancel, done, error with Try again. Without an image API or catalog it offers only Start chatting.

## Methods

- `ImageStep.render(wizard, body)`; `ImageStep.offerHtml(runtime, model)`.

## Globals

None.
