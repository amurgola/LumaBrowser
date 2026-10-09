# HarnessText

`extensions/ext-test-harness/ui/HarnessText.js`

Small text helpers the Test Harness panel shares.

## Methods

- `HarnessText.formatTime(iso)`: `Never` for no time, else a locale
  month/day/hour/minute/second stamp.
- `HarnessText.formatDuration(ms)`: `''` for no value; `Nms` under 1 s,
  `N.Ns` under a minute, else `N.Nm` (0 renders `0ms`).
- `HarnessText.parseJson(text)`: the parsed value, or `null` for empty or
  invalid JSON (the `assertions` column is stored as text).
- `HarnessText.roleLabel(role)`: `System`, `Assistant` or `User/Tool`.
- `HarnessText.detailParts(run, detail)`: `{ assertions, fullLog, toolCalls,
  notes, conversation }` with empty defaults; assertions fall back to the run
  row's JSON.
