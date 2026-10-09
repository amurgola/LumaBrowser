# SysdepsReport

`core/shared/runtime/SysdepsReport.js`

Shapes the system-library preflight result that `SysdepsChecker` returns and
the UI renders.

## Methods

- `SysdepsReport.aptLineFor(packages)` returns `sudo apt install <unique packages>`,
  or `null` when there are none.
- `SysdepsReport.describeMissing(missing)` returns the plain sentence the UI
  shows: "One system library is missing: X." or "N system libraries are
  missing: ...", followed by the "Run the command below ... Check again"
  instruction. Uses the package name, or the soname when no package is known.
  Never includes linker text.
- `SysdepsReport.build(missing, rawLog, extra, platform)` builds
  `{ ok, platform, missing, packages, aptLine, message, rawLog, ...extra }`.
- `SysdepsReport.notApplicable(reason, platform)` is the ok, nothing-to-do
  result, with `skipped: reason` (default `'not-linux'`).
- `SysdepsReport.merge(results, platform)` unions the missing sonames of
  several results (null entries skipped) and joins their raw logs with
  newlines. For a duplicate soname the first entry wins, unless it has no
  package and a later one does, so the apt line gains the package.
- `SysdepsReport.ALL_PRESENT_MESSAGE` is the "all installed" sentence.

`platform` defaults to `process.platform` everywhere.
