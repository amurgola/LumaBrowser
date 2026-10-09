# GameStatusPanel

`extensions/game-mode/ui/GameStatusPanel.js`

Game mode's edit-time status card (`.gm-panel`, tagged `data-cm-overlay`).

## Methods

- `new GameStatusPanel(actions)`: `actions` maps the buttons' `data-gm`
  values (`play`, `popout`, `export`, `share`, `newgame`, `collapse`) to
  handlers; one delegated click listener calls them.
- `ensure()`: creates the hidden card once and docks it.
- `render(game, collapsed)`: [GamePanelMarkup](GamePanelMarkup.md) html and
  the `gm-collapsed` class, or `clear()` when the snapshot has no content.
- `clear()`: hides and empties the card.
- `note(text, isErr)`: shows the note line, `gm-note-err` for errors.
- `element`: the card, or null.

Docking: the card becomes the rightmost column of `#chatRoot .cm-stage`
(class `gm-docked`) so the chat keeps its full height beside it; until the
stage exists it mounts on `<body>`, and a later `ensure()` upgrades it.

## Globals

Reads `document`.
