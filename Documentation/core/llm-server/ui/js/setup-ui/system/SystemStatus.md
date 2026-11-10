# SystemStatus

`core/llm-server/ui/js/setup-ui/system/SystemStatus.js`

What the LLM Setup system cards report to the [system status line](SystemStatusStrip.md): one `{ tone, value, title }` per card, worked out from data the card already renders, sent as a `luma-system-status` document event (`detail: { key, tone, value, title }`).

Tones:

- `ok`: healthy; the card may fold.
- `off`: optional and not set up (visual grounding); the card may fold.
- `attention`: the user has something to do; the card opens.
- `busy`: a download or install is running; the card opens without the warning colour.
- `pending`: not loaded yet (the line's own default).

## Methods

- `SystemStatus.emit(doc, key, status)`: keys are `runtimes`, `models`, `grounding`.
- `SystemStatus.unfoldAround(el)`: dispatches `luma-sys-unfold` from the folded card around `el`, so a deep link (the search palette's [PaletteDeepLinks](../../chat/PaletteDeepLinks.md)) can open it before scrolling.
- `SystemStatus.runtimes(store, chosenId?)`: from the [RuntimeStatusStore](../runtimes/RuntimeStatusStore.md). No installed inference runtime, nothing installed that can run, or an upstream update for the runtime in use (any runtime when none is chosen, see `updateNeedsAttention`) is `attention`; otherwise `ok` with the Chat defaults runtime's name (else "X and 2 more"). A stray build this machine cannot drive keeps its badge in the card but does not open it.
- `SystemStatus.models(config, scan)`: an unavailable folder or an empty one is `attention`; otherwise `ok` with "9 models in .lmstudio\models" (the last two path segments; the full path is the title).
- `SystemStatus.grounding(view, stateLabel, error?)`: not set up is `off`, an error is `attention`, otherwise `ok` with "model, state". A missing grounding API reports `off` "Unavailable".
- `SystemStatus.imageRuntimes(runtimes, updates, chosenId, progress)` and `SystemStatus.imageModels(installed, config, error, activeDl)`: the Image tab's two parts (an install or download in flight is `busy`).
- `SystemStatus.updateNeedsAttention(installed, chosen, updateOf)`: a newer release of a build the user does not run keeps its Update button in the card without opening it.
- `SystemStatus.error(text)`: the `attention` status a card sends when its view failed to load.
- `SystemStatus.pathTail(path)`.

## Emitters

[RuntimesCard](../runtimes/RuntimesCard.md) (after each paint and after the update check), [ModelsCard](../models/ModelsCard.md) (after each paint) and [GroundingSetupCard](../../grounding-setup/GroundingSetupCard.md) (after each render, every poll).

## Globals

None.
