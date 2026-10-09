# GamePanelMarkup

`extensions/game-mode/ui/GamePanelMarkup.js`

The status card's markup.

## Methods

- `GamePanelMarkup.hasContent(game)`: files, assets or a playable game.
- `GamePanelMarkup.isAiGame(game)`: `gameKind === 'ai'`.
- `GamePanelMarkup.fileDot(file)`: `writing` while being written, else `ok`
  (Valid) or `bad` (Has problems).
- `GamePanelMarkup.assetDot(asset)`: `ok` done, `bad` error, `writing`
  pending, else `queued`; title from `ASSET_LABEL`.
- `GamePanelMarkup.html(game, collapsed)`: head (name, `AI` tag for AI games,
  status from `STATUS_LABEL`, collapse toggle), one `.gm-row` per file then
  asset, Play / Pop out, Export zip plus Share link (web) or New game (AI),
  and a hidden `.gm-note`. Buttons are disabled until `playable`. Text is
  escaped with `HtmlEscaper.escapeText` (`&`, `<`, `>`), as legacy did.

## Globals

None.
