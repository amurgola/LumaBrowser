# PreflightRuntimeIssue

`core/llm-server/PreflightRuntimeIssue.js`

Builds the [Preflight](Preflight.md) issue for a configured default runtime.
LLM, image and music runtime rows all come from the shared runtime detector,
so one rule set serves all three.

## Methods

- `PreflightRuntimeIssue.findRuntime(view, runtimeId)` returns the row in
  `view.runtimes` with that id, or `null` (also for a missing view).
- `PreflightRuntimeIssue.forRow(row, { runtimeId, area, server, featureLabel, view })`
  returns one issue or `null`:
  - no row: `<area>-runtime-unknown` (error, open-view): not offered on this platform.
  - `!row.installed`: `<area>-runtime-missing` (error). The detail mentions a
    stale manual registration when `row.staleManualRegistration`. The fix is
    `install-runtime` unless `row.assetSupported === false` or
    `row.acquisition === 'manual-source'`, which get `open-view`.
  - `row.hardware.ready === false`: `<area>-runtime-hardware` (warning,
    open-view) with `row.hardware.note` as the detail.
  - otherwise `null`.

## Why the download button is conditional

Source-only runtimes (mlx-lm, a self-built fork) and hosts with no prebuilt
asset (music on Windows without WSL2) cannot be fixed by a download, so they
point at the Setup card, which explains the build or pip path.
