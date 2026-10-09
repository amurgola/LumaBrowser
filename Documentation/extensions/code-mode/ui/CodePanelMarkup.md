# CodePanelMarkup

`extensions/code-mode/ui/CodePanelMarkup.js`

The build panel's markup.

## Methods

- `CodePanelMarkup.fileDot(file)`: `writing` (Writing…) while a
  write_extension_file call validates, else `ok` (Valid) or `bad` (Has problems).
- `CodePanelMarkup.laneDotClass(status)`: `running` -> `writing`, `error` ->
  `bad`, `done` -> `ok`, else `queued`.
- `CodePanelMarkup.batchHtml(lanes)`: head `Parallel tasks` / `<n> lanes`,
  one row per lane `<kind>: <first 60 chars of instruction>` titled from `BATCH_LABEL`.
- `CodePanelMarkup.buildHtml(build)`: head with the id (default `extension`)
  and status (`cm-<status>`, label from `STATUS_LABEL`, default `drafting`),
  one row per file, and `Activated as <code>id</code>, live now.` when installed.

Text is escaped with `HtmlEscaper.escapeText` (`&`, `<`, `>`), as legacy did.

## Globals

None.
