# GameStrip

`extensions/game-mode/ui/GameStrip.js`

Game mode's strip above the composer (`.gm-strip`). It extends core's
[ComposerStrip](../../../core/llm-server/ui/js/chat/composer/ComposerStrip.md)
with order 40, so it sits nearest the composer, below the jobs (10), plan (20)
and queued-message (30) strips. It replaced the right-docked status card.

## Methods

- `new GameStrip(actions)`: `actions` maps the buttons' `data-gm` values
  (`play`, `popout`, `export`, `share`, `newgame`) to handlers.
- `attach(bar)` (inherited): the composer bar the strip lives in; paints.
- `show(game)`: the snapshot to draw (null for none), then paints.
- `reset()`: forgets the game and the note and takes the strip down (leaving
  the conversation).
- `note(text, isErr)`: the line under the head for export, share and reset.
  It is part of the strip's state, since every paint rewrites the markup, and
  stays until the next action or conversation.
- `html()`: [GameStripMarkup](GameStripMarkup.md) for the snapshot, `''` when
  it has nothing to show (the strip is then not on the page).
- `onClick(event)`: the fold toggle (`data-gm="collapse"`) flips the fold and
  repaints; any other enabled `data-gm` button calls its handler.
- `mounted`: whether the strip's element is on the page.

Folded by default; the fold is kept across conversations for the sitting.

The chat rebuilds the composer bar on a regenerated or edited turn without
calling the mode's `decorateComposer` again, which drops the strip's element.
The bar itself is the same element, so the next `paint()` puts the strip back;
[GameChatMode](GameChatMode.md) repaints on the next mode event when
`mounted` is false.

## Globals

Reads `document` through the base class.
