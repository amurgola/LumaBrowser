# TerminalServices

`app/services/TerminalServices.js`

Builds the terminal subsystem into `ctx.services`: `terminalProfiles`
([TerminalProfileRegistry](../../core/terminal/shells/TerminalProfileRegistry.md)), `terminalSettings`,
`terminalService` (also published as `global.__lumaTerminal`) and `terminalViewers`. The host process is not started
here; it starts with the first terminal. Shell integration files go under `<userData>/terminal/shell-integration`.

## Methods

- `new TerminalServices(ctx)`, `build()` -> the terminal service.

The service is given a `TerminalTabContext` over the tab manager.
