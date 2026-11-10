# SystemStatusStrip

`core/llm-server/ui/js/setup-ui/system/SystemStatusStrip.js`

The LLM Setup system status line (`#systemStrip`, full width under Chat defaults and the launch plan). It stands in for the Inference runtimes, Models directory and Visual grounding cards once they are healthy: those cards are set up once and rarely revisited, so they should not take most of the page. Each part (Runtime, Models, Vision helper) shows its card's [SystemStatus](SystemStatus.md) in a few words; clicking a part opens or folds that card.

Rules:

- Every card starts folded behind "Checking..." so the page does not flash three full cards before the statuses arrive.
- A card whose status is `attention` opens on its own. After it recovers it stays open for the rest of the session, so it does not vanish under the user's cursor right after they fixed it.
- Cards the user opened are remembered across reloads (`localStorage` `luma.setup.sys.open`).
- A `luma-sys-unfold` event from inside a folded card (see `SystemStatus.unfoldAround`) opens it for the session.
- A folded card gets `.sys-folded` (`display: none`); the cards carry `data-sys-fold="<key>"`. An open system card spans the full row, except Runtimes and Models side by side when both are open.
- Styling follows [DesignSystem](../../../../../../ui/DesignSystem.md): neutral text, the open part gets the `--bg-surface-2` fill, `attention` values use `--warning` and always carry a word.

## One line per tab

The LLM tab's line (`#systemStrip`, `ITEMS`, remembered under `luma.setup.sys.open`) and the Image tab's (`#imageSystemStrip`, `IMAGE_ITEMS`: Runtime and Models over Image runtimes and Image models, remembered under `luma.setup.sys.image.open`). Each strip only takes statuses and unfold requests for its own keys. `busy` keeps a card open like `attention`, without the warning colour.

## Methods

- `new SystemStatusStrip({ doc?, win?, rootId?, items?, storeKey? })`; `start()` (false without `#systemStrip`), `stop()`.
- `isOpen(key)`.
- `ITEMS`: `{ key, label, card }` for the three parts.

## Globals

None.
