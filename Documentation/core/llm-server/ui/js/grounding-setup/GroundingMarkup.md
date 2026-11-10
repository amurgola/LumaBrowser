# GroundingMarkup

`core/llm-server/ui/js/grounding-setup/GroundingMarkup.js`

Markup for the Visual grounding card. Before a model is set up, the recommended downloads (accented) and the GGUF picker are the next step and show in full. Once one is set up, the server buttons stay in view and the other recommended models plus "Choose a GGUF..." fold behind a "Change vision model" disclosure (`data-fold-key="grounding.change"`, remembered by [FoldMemory](../setup/FoldMemory.md), open while a download runs), with plain Download buttons, so the card never shows an accented download for a model the user does not need.

## Methods

- `GroundingMarkup.pill(view)` returns `{ text, className }`; `GroundingMarkup.html({ view, desktop, dl, busy, error })`; `STATE_LABEL`.

## Globals

None.
