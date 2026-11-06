# DigView

`core/palette/ui/js/DigView.js`

The palette's "Dig deeper" pane: the question, the model's answer streaming in,
the places it looked at, and the "Continue in chat" and "Back to results"
buttons. Fed by [DigDeeper](../../DigDeeper.md) events through
`paletteAPI.onDigEvent`.

## Methods

- `new DigView({ el, api, onOpen })`; `onBack` is set by
  [PaletteApp](PaletteApp.md).
- `start(query)`: paints the pane with a waiting line and calls `api.dig(query)`.
- `stop()`: hides and empties the pane and calls `api.digAbort()`.
- `handle(payload)`: `context` stores the chips by tag and lists them under
  "Places it looked at"; `delta` and `done` repaint the answer; `error` shows the
  message, or, with `noModel`, explains that no chat model is set up yet.
- `DigView.cite(tag, item)`: the small "open" arrow button that replaces an
  `[S1]` or `[C2]` tag in the answer (titled "Open <name>").
- A click on a cite button or a listed place opens it through `onOpen`.

## Why

The answer is escaped text with only the citation buttons added, so model output
never becomes markup. Documentation tags (`[D1]`) have nothing to open and are
dropped as they stream. Any other tag with no chip stays as typed while streaming
(it may be half written) and is removed from the finished answer.
