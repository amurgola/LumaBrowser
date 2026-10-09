# ValidationResult

`core/llm-server/validation/ValidationResult.js`

Builds the result shape [CodeValidator](CodeValidator.md) returns and renders it
for the model.

## Methods (all static)

- `unsupported(language, filename)`: `ok: true, supported: false`, summary
  `No in-process validator for "<what>", skipped.`
- `crashed(language, engine, error)`: `ok: true, supported: true`, `error`
  message, summary `Validator error (<language>): <message>, skipped.`
- `fromDiagnostics(language, engine, diagnostics)`: sorts a copy by line then
  column, counts `errors`/`warnings`, `ok` when no errors, summary
  `N error(s), M warning(s)`.
- `formatForModel(result, { max = 25 })`: `''` for no result;
  `VALIDATION: <summary>` when unsupported;
  `VALIDATION (<lang>): clean, no issues found.` when there are no diagnostics;
  otherwise a header line plus one `  L<line>:<col> <severity> <message> [<ruleId>]`
  line per diagnostic up to `max`, then `  ...and N more.` (a real ellipsis).
- `FORMAT_MAX` (25).
