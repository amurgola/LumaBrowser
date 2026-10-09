# TabConsoleLog

`core/browser/tab-view/TabConsoleLog.js`

A bounded ring of console messages per tab (`entry.consoleLogs`), read by
automation's `getConsoleLogs`.

## Methods

- `TabConsoleLog.add(entry, level, message, source, line)`: appends
  `{ level, message, source, line, timestamp }`, keeping the last `LIMIT` (100).
  A null entry is ignored.
- `TabConsoleLog.list(entry, { level })`: a copy, optionally filtered. A filter
  matches the stored level or, for old numeric levels (0-3), its word
  (`verbose`, `info`, `warning`, `error`).
