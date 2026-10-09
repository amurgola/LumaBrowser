# ConsoleOutput

`cli/lib/launcher/ConsoleOutput.js`

Coloured status lines for the npm launcher.

## Methods

- `new ConsoleOutput({ stdout?, stderr? })`.
- `log(m)` plain, `info(m)` cyan, `ok(m)` green, `warn(m)` yellow (stdout), `err(m)` red (stderr),
  `progress(text)` (no newline, for carriage-return progress).
- Statics: `RED`, `GREEN`, `YELLOW`, `CYAN`, `DIM`, `RESET`.
