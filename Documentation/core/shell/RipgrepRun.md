# RipgrepRun

`core/shell/RipgrepRun.js`

Reads one running `rg --json` child process into `{ matches, limitReached, scanned }`.

## Methods

- `new RipgrepRun(child, rootDir, limit)` wraps a spawned child with `stdout`, `stderr`, `kill()` and `error`/`close`
  events.
- `run.result()` resolves `{ matches: [{ file, line, text }], limitReached, scanned }` or rejects.

## Behaviour

- NDJSON is parsed line by line across chunk boundaries. `match` records become matches with paths relative to
  `rootDir` and `/`-separated; `summary.stats.searches` becomes `scanned`.
- At `limit` matches it sets `limitReached` and kills the child instead of reading a large repo to the end.
- Exit 0 (found) and 1 (nothing) resolve; a `null` code after the cap kill resolves with what was kept; anything else
  rejects with the first stderr line.
- A non-UTF-8 line (ripgrep sends base64 `bytes`) keeps its line number with the placeholder
  `(line is not valid UTF-8)`. Matched lines are clipped to 500 characters.

## Why

Two failure rules are correctness decisions: a record that cannot be parsed fails the search, and so does output over
20 MiB. A silently partial result set is indistinguishable from a genuine "no more matches", and the last line of a
cut-off NDJSON stream is usually still valid JSON, so a partial parse looks exactly like a complete one. The agent
would draw conclusions from an absence we invented.
