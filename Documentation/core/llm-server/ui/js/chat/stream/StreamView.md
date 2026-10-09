# StreamView

`core/llm-server/ui/js/chat/stream/StreamView.js`

The live turn on screen. Its answer body is bound to the `liveAnswer` scalar of
the chat's Resonant and fed by a stream sink (55 ms throttle, markdown with the
choices fence cut, selection guard: all in ResonantJs). While the sink runs the
markdown is rendered with `{ streaming: true }` (see
[StreamingMarkdown](../../markdown/StreamingMarkdown.md)). A MutationObserver on
the body polishes each repaint in the same task, before the browser paints:
[StreamImages](StreamImages.md) carries images over and
[StreamFade](StreamFade.md) fades in the words that just arrived. A 55 ms pass keeps the
reasoning pane (collapsing it when the answer starts), the tool chain (rebuilt
only when its signature changes), artifacts, sub-agent cards and the scroll
position in step, and is skipped while the user selects text in the live turn.

## Methods

- `register()`: adds `liveAnswer` and its render transform.
- `append({ replace }?)`: retires older turns' chips, edit button and editor,
  renders the live turn and paints the pulse; `replace` re-attaches after the
  user browsed away and back (the sink outlived the navigation).
- `turnEl()`, `write(text)`, `rewind(n)`, `endSink()`, `scheduleRender()`,
  `cancelRender()`.
- `settle(body)`: stops observing and lets fades and images still running carry
  on in the static body that replaced the live one.
