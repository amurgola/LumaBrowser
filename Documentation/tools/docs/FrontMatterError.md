# FrontMatterError

`tools/docs/FrontMatterError.js`

The error malformed doc front matter raises. The message is `<file>: <problem>` and `file` holds the doc's
root-relative path, so a typo fails the run loudly instead of silently retiring the doc.

## Methods

- `new FrontMatterError(file, message)`; fields `file`, `name` (`'FrontMatterError'`).
