# Transcript

`ide/webview/ui/Transcript.js`

The conversation column: appends blocks, keeps the view pinned to the bottom unless the user scrolled more than
40px away, paints the one-shot blocks and the live status line.

## Methods

- `new Transcript(el, grammar)`: `el` holds `scroller`, `transcript`, `live`.
- `push(node)`, `autoscroll()` (once per animation frame), `hasBlocks()`, `clear()`.
- `user(text, context)`, `error(message)`, `note(text, level)`, `artifact(title, type)`,
  `summary({ aborted, iterations, tokens, secs, tps })`.
- `setStatus(text)`: the spinner line; `null` clears it. `status` holds the current text.

## Globals

Reads `document`, `requestAnimationFrame`.
