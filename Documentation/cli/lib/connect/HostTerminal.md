# HostTerminal

`cli/lib/connect/HostTerminal.js`

The LumaBrowser terminal this CLI was started in, if any: `LUMA_TERMINAL`, which every terminal inside the app sets.
The TUI and the plain session send it in `hello` as `terminal`, which lets the app tell the agent which browser tab
the terminal sits under (`extensions/code-mode/terminal/BrowserTabContext`).

## Methods

- Static `id(env)` -> the terminal id (`t` and digits), or null outside a LumaBrowser terminal.
