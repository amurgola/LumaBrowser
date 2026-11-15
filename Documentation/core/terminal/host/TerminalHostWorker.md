# TerminalHostWorker

`core/terminal/host/TerminalHostWorker.js`

Entry of the terminal host process (an Electron utility process forked by
[TerminalHostClient](../TerminalHostClient.md)). It loads the native pseudoterminal module (`@lydell/node-pty`, the
prebuilt distribution of node-pty) and the headless terminal (`@xterm/headless`, `@xterm/addon-serialize`), then
serves the main process from a [PtySessionTable](PtySessionTable.md).

Inside a packaged app the module is loaded from `app.asar.unpacked`: its DLL, helper programs and worker script must
be real files on disk.

Messages: `init` -> `ready` or `init-error`; `request { id, method, params }` -> `response { id, result | error }`;
`post { method, params }` (no reply); `shutdown`. Session events go out as `event { event }`.

## Methods

- `new TerminalHostWorker(port, { load, exit })`, `listen()`. Static `loadModules()`.
