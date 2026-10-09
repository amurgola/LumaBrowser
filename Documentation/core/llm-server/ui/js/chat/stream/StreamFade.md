# StreamFade

`core/llm-server/ui/js/chat/stream/StreamFade.js`

Fades in the words of a streaming answer as they arrive (opacity and a 2px blur,
320 ms, each arrival's words staggered 12 ms apart over a cycle of 12). The
live body is rebuilt with `innerHTML` on every flush, so the fade cannot live on
long-lived nodes. Instead each repaint records when its new text arrived, as an
offset into the rendered text (which only grows while the stream runs), and
wraps just the words still inside the fade window in `span.cm-fresh` with a
negative `animation-delay` that resumes the fade where the previous rebuild
left it. A word never replays, and only a few dozen spans exist at a time.

## Methods

- `new StreamFade({ now?, reducedMotion? })`: injectable clock and
  reduced-motion check (defaults: `performance.now()`, the
  `prefers-reduced-motion` media query; reduced motion turns it off).
- `reset()`: a new answer.
- `apply(el)`: after a repaint of the live body. Text that shrank (a rollback)
  forgets the arrivals past the new end.
- `settle(el)`: the static body that replaced the live one at the end; fades
  still running carry on there when its text length matches the live text,
  otherwise they are dropped. Resets.

Text inside an inline SVG (the pulse icon) is not counted. The keyframes live
in `ui/css/chat.css` (`cm-word-in`).

## Globals

None.
