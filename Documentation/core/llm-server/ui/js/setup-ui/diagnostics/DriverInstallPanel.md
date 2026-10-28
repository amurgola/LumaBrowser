# DriverInstallPanel

`core/llm-server/ui/js/setup-ui/diagnostics/DriverInstallPanel.js`

The "Intel compute drivers" block under the GPU card on Linux: what is
missing, what each piece unlocks, the exact command, and the Install button
that opens a terminal where sudo asks for the password.

## Methods

- `new DriverInstallPanel({ api, doc, reload })`: `api` is `window.llmDiagAPI`,
  `reload()` a forced diagnostics reload.
- `render()`: calls `getDriverInstallPlan()` and appends the block
  (`#driverInstallPanel`) to `#gpuBody` when the plan applies, else removes
  it. Safe without the API or on a failed call.
- `DriverInstallPanel.html(plan)`: the pieces with their packages (or "no
  package on this distribution"), a "What will happen" paragraph naming the
  distribution and package manager and saying sudo asks in the terminal, the
  command in a `pre[data-driver-command]`, the notes, then the buttons
  (`data-install-drivers`, `data-copy-driver-cmd`) and the status span
  (`data-driver-status`). Without a command there are notes only and no
  Install button.
- `install(button)`: disables the button, says the terminal is opening
  (`WAITING`), awaits `installDrivers()`, then reports `ok` and reloads, or
  the error (a closed window, a non-zero exit) and re-enables the button.
- `copy(button)`: the command via [Clipboard](../../dom/Clipboard.md).

[DiagnosticsLoader](DiagnosticsLoader.md) renders it after each fresh paint;
[SetupClickRouter](../SetupClickRouter.md) routes its buttons.

## Globals

Reads `document` by id.
