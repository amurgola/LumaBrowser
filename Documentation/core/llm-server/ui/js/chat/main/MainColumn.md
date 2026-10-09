# MainColumn

`core/llm-server/ui/js/chat/main/MainColumn.js`

The chat column: the top bar (the conversation title, which opens its menu, and
the conversation-scoped Artifacts button), the message scroller with its
auto-follow, and the "New text" pill that re-pins it after the user scrolls up
mid-stream.

## Methods

- `build()`: also installs the [CodeBlockBar](CodeBlockBar.md) and routes
  scroller clicks (and mouseovers, for the pager preview) to
  [TurnActions](../turns/TurnActions.md) and clicks to
  [TableSort](../turns/TableSort.md); scrolling and window
  resizes poke the [PreviewSlot](../turns/PreviewSlot.md).
- `titleText()`, `setTitle(text)`, `showTitle(text)`, `hideTitle()`.
- `showStaticView(title)`: a full-pane view with no composer or artifacts
  button (task and trigger runs, mode setup).
- `clearComposerBar()`, `syncActiveTitle()`.
- `pinBottom()`, `maybeScroll()`, `updateJumpPill()`.

A task's or trigger's runs view has no conversation, so its title opens that
row's menu instead.
