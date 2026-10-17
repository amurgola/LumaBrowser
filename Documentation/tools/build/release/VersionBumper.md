# VersionBumper

`tools/build/release/VersionBumper.js`

Maintains the version in `package.json`, `package-lock.json` (both `version`
and `packages[""].version`) and `cli/package.json` (skipped when absent): one
step with per-digit rollover (1.7.9 -> 1.8.0, 9.9.9 -> 10.0.0; a component
already past 9 keeps counting: 1.10.0 -> 1.10.1), an explicit `x.y.z`, or a
read-only report. Files are written the way npm writes them (2-space JSON,
trailing newline) so the diff is only the version lines.

## Methods

- `VersionBumper.parse(version)` splits `x.y.z` into numbers and throws
  `Unexpected version format` for anything else; `VersionBumper.bump(version)`
  returns the next step.
- `new VersionBumper(repoRoot).execute()` bumps every file one step;
  `execute('2.1.0')` writes that version into every file instead, which also
  realigns files that had drifted apart. The target is validated before any
  file is touched. Both return `{ results: [{ rel, from, to }], version,
  consistent }`.
- `current()` returns `{ results: [{ rel, version }], version, consistent }`
  without writing. `version` is what `package.json` holds.

## Entries

`scripts/bump-version.js` (plain, `--to <x.y.z>`, `--current`) and
`scripts/sync-prod.bat`, which shows `--current`, prompts for the version to
ship and applies `--to` before the prod sync. See
[BuildScripts](../../../scripts/BuildScripts.md).
