# TerminalSettings

`core/terminal/TerminalSettings.js`

The user's terminal settings over the settings store.

- `core.terminal.agentAccess` (default **false**): whether AI may use the terminal. Off until the user turns it on,
  because a terminal runs anything the user can. [TerminalMcpTools](TerminalMcpTools.md) reads it on every call.
- `core.terminal.fontSize` (8 to 32, default 13) and `core.terminal.fontFamily`.
- The default profile is kept by [TerminalProfileRegistry](shells/TerminalProfileRegistry.md).

## Methods

- `new TerminalSettings({ db, profiles })`.
- `view()` -> `{ fontSize, fontFamily, agentAccess, defaultProfile }`, `fontSize()`, `fontFamily()`, `agentAccess()`.
- `update(patch)` -> `{ success, ...view }`; an unknown default profile is the one thing that fails.
