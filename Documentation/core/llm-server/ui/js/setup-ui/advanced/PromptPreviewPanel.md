# PromptPreviewPanel

`core/llm-server/ui/js/setup-ui/advanced/PromptPreviewPanel.js`

The "System prompt preview" panel: the exact system prompt of a Tools-on turn from the current settings.

## Methods

- `new PromptPreviewPanel(chatApi)` (a getter for `llmDiagAPI.chat`); `render(body)`, `show(panel)`, `summary(result)`.
- `render(body)` builds the panel, remembers it as the one on screen, and puts back the last result and the "Image attached" tick.
- `show(panel)` fetches `previewSystemPrompt({ withImages })`, keeps the outcome (`{ response }` or `{ error }`) and paints it into the panel on screen when it arrives, so a redraw during the fetch does not lose it.

## Kept across canvas redraws (2026-11-14)

[AdvancedView](AdvancedView.md) rebuilds the whole canvas on every `render()`, and the panel used to come back hidden, so an opened prompt (a tall block) vanished and the page jumped on any redraw (ISSUES.md 37, residual). The panel now keeps its last result and checkbox state the way [TestRenderPanel](TestRenderPanel.md) keeps its last results; a redraw does not fetch again.

## Globals

None.
