# PreflightInstall

`core/llm-server/ui/js/setup-ui/preflight/PreflightInstall.js`

Runs a preflight "Download and install" fix on the right runtime surface and streams its events into the row's progress bar.

## Methods

- `new PreflightInstall(api)`; `run(issue, row, btn)` resolves true on success; a failure paints "Failed: <error>" and re-enables the button.
- `PreflightInstall.progressFor(type, payload)`: start, resolved, download, extract, finalize -> progress options, else null.

## Globals

None.
