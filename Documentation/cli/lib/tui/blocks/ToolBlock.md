# ToolBlock

`cli/lib/tui/blocks/ToolBlock.js`

One tool step as an inline row.

## Members

- `new ToolBlock({ tool, params })`; fields `tool`, `params`, `success`, `error`, `summary`,
  `output`, `decision` (`once`, `run`, `reject`), `startedAt`, `endedAt`.
- `finish({ success, error, summary })`: done; flushes a partial output line.
- `appendOutput(chunk)`: command output, split into lines, last `MAX_OUTPUT_LINES` (400) kept.
- `elapsed()`: seconds.
- `render(width, theme, { spinner })`: the title row is the glyph (spinner while running, `✓`, `✗`,
  or a muted `✗` when denied), the verb and detail from [ToolGrammar](../ToolGrammar.md) (`$ <command>`
  for commands), and a tail (`denied`, `allowed for this run`, the trimmed summary, the error, a
  command's time). Under a command: its last 8 output lines while running, 6 when done, 12 when it
  failed, with an `… N earlier lines` row. Under an edit: a `-`/`+` diff, capped at `DIFF_CAP` (14)
  lines.
