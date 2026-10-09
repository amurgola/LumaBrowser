# RunMarkdown

`extensions/ext-test-harness/ui/RunMarkdown.js`

The "Copy as MD" export of a Test Harness run.

## Methods

- `RunMarkdown.format(run, detail)`: `# Test Run: <test>[ / <variant>]`, a
  field table (run id, status, started, completed or `N/A`, duration, total
  iterations or `N/A`, total tool calls), then each non-empty section:
  `## Assertions` (detail cut to 200 chars), `## Tool Calls` (a table with
  params cut to 77 chars plus `...` past 80, `**err**` for a failed call, and
  a `**Tools used**` line), `## Notes (Manual Review)` (data fenced),
  `## Conversation Log` (each message fenced under its role),
  `## Final Response`, `## Error`.
