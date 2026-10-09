# GroundingSetupCard

`core/llm-server/ui/js/grounding-setup/GroundingSetupCard.js`

The "Visual grounding" card of the LLM tab settings. Drives the managed grounding server (a small vision model on its own llama-server that finds elements on screenshots for the locate tool and desktop control): model and server state, recommended downloads with progress, a GGUF picker, Start now, Stop server, Remove, and the "Allow desktop control" opt-in.

## Methods

- `new GroundingSetupCard({ getApi? })`: `getApi` returns llmDiagAPI; the card uses `.grounding` (`getView`, `desktopState`, `setDesktopEnabled`, `downloadRecommended`, `cancelDownload`, `setModel`, `pickModel`, `start`, `stop`, `onEvent`).
- `start()`: returns false without the grounding API; otherwise adds the delegated document click and change listeners (scoped to `#groundingBody`), subscribes to download events, refreshes, and re-polls every 5 s while the page is visible. `stop()` undoes all of it.
- `refresh()`, `render()`. A `{ success: false }` result that is not a cancel shows as the card's Problem.

## Globals

Reads `window.llmDiagAPI` (default), `document.hidden`. Writes none.
