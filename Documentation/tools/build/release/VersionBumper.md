# VersionBumper

`tools/build/release/VersionBumper.js`

One version step with per-digit rollover (1.7.9 -> 1.8.0, 9.9.9 -> 10.0.0; a
component already past 9 keeps counting: 1.10.0 -> 1.10.1) in `package.json`,
`package-lock.json` (both `version` and `packages[""].version`) and
`cli/package.json` (skipped when absent). Files are written the way npm writes
them (2-space JSON, trailing newline) so the diff is only the version lines.

## Methods

- `VersionBumper.bump(version)`; `new VersionBumper(repoRoot).execute()` returns
  `{ results: [{ rel, from, to }], version, consistent }`.
