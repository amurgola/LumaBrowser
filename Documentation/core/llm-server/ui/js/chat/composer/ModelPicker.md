# ModelPicker

`core/llm-server/ui/js/chat/composer/ModelPicker.js`

The model selection: the listed models, local models with per-context options
(fit-measured or estimated), the pill label ("Local · Qwen3-8B · 16k"), the
picker popover, and the context window the usage meter divides by.

## Methods

- `refresh()`: `api.listModels`; keeps a still-listed selection, else the
  default, else the first; feeds [Availability](Availability.md).
- `loadLocal()`: `api.getLocalModelOptions` (fire and forget), seeding the pinned
  model's context from the live default.
- `renderPill()` (every selection change ends here, so the thinking dial follows).
- `currentLabel()`, `chosenCtx(model)`, `activeCtxWindow()`.
- `selectLocal(model, tokens)`: persists `setDefaults({ modelPath, contextSize })`
  and `setLastModelRef`. `selectRemote(model)`.
- `openPicker(anchor, refresh)`: local models with context chips, then Anthropic
  and Providers groups (and the plain local entry while the rich list has not
  landed); clamped with [PopoverFit](../common/PopoverFit.md); `refresh`
  re-fetches local options for the NEXT open only.
