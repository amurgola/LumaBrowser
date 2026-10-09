# ExistingLibraryView

`core/llm-server/ui/js/setup/ExistingLibraryView.js`

Shapes a scan of models the user already has for both setup front doors.

## Methods

- `ExistingLibraryView.view(scan, { limit }?)` returns `{ models, shown, more,
  bySource, expanded }`: the scan's models (largest first, as scanned), the first
  `limit` (default 8) of them, the count left over, a sentence like "3 from LM
  Studio, 1 from the Hugging Face cache" (zero counts skipped, unknown keys
  printed raw), and `expanded`, true as soon as one model is found (someone with
  weights on disk should see them before any download offer).
- `ExistingLibraryView.modelsOf(scan)`: the model list, or `[]` for a failed or
  missing scan.
- `ExistingLibraryView.sourceLabel(key)` and `SOURCE_LABELS` (LLM sources and
  the image tools ComfyUI, Fooocus, Stable Diffusion WebUI, Forge, SD.Next,
  SwarmUI, Stability Matrix, "the chosen folder").

## Globals

None.
