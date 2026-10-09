# GroundingModelSelection

`core/grounding-server/GroundingModelSelection.js`

Chooses the grounding model (set, picked from disk or downloaded) and keeps the
`visual-grounding` LLM slot in step with it.

## Methods

- `new GroundingModelSelection({ groundingServerService, llmService?, pickPath })`;
  `pickPath(dialogOptions)` resolves a `PathPicker.pick` result.
- `setModel(sel)` `GroundingServerService#setModel(sel || {})`; on success a
  `modelPath` routes the slot, an empty one releases it. Returns the service result.
- `pickModel()` opens `PICK_DIALOG` (GGUF files); a cancel is
  `{ success: false, canceled: true }`, else `setModel({ modelPath })`.
- `downloadRecommended(id, emit)` streams each event as `emit(ev.type, ev)`; on
  success routes the slot.
- Statics `SLOT_ID` (`visual-grounding`), `PICK_DIALOG`.

Routing sets the slot to `GroundingServerService.PROVIDER_ID` with the provider
entry's `selectedModel` (LLMService honours a slot only with both). Releasing
clears the slot only when its provider is the grounding server. Without
`llmService` the slot is left alone.
