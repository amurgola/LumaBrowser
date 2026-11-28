# GameStripMarkup

`extensions/game-mode/ui/GameStripMarkup.js`

The markup of the [game strip](GameStrip.md).

## Methods

- `GameStripMarkup.hasContent(game)`: files, assets or a playable game.
- `GameStripMarkup.isAiGame(game)`: `gameKind === 'ai'`.
- `GameStripMarkup.unfinishedArt(game)`: the assets whose status is not
  `done` (`pending`, `placeholder`, `error`).
- `GameStripMarkup.counts(game)`: `9 files`, plus `art 3 of 4` only while
  some art is not done, joined by a middle dot.
- `GameStripMarkup.writingPath(game)`: the path of the file whose phase is
  `writing`, else `''`.
- `GameStripMarkup.html(game, { collapsed, note })`:
  - head (`.gm-strip-head`): the fold toggle (core's `.cm-plan-toggle` with
    the chevron icon, `aria-expanded`), name, `AI` tag for AI games, status
    from `STATUS_LABEL` (Building, Ready, Needs fixing, Stopped), the counts,
    `.gm-now` (folded only: `Writing <path>`), then `.gm-actions`: Play (the
    one primary button), Pop out, Export zip and Share link (web) or New game
    (AI). Buttons are disabled until `playable`.
  - unfolded only, `.gm-list`: one `.gm-row` per file (dot `writing` with the
    word Writing, `ok` with no word, `bad` with Has problems), then one per
    unfinished asset with its word from `ART_LABEL` (Waiting for its render,
    Placeholder, Render failed). Finished art has no row, and art being
    rendered is shown by the chat's jobs strip.
  - `.gm-note` when a note is set (`gm-note-err` and `role="alert"` for an
    error, else `role="status"`).

Text is escaped with `HtmlEscaper.escapeText`.

## Globals

None.
