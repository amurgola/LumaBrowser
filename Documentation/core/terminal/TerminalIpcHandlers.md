# TerminalIpcHandlers

`core/terminal/TerminalIpcHandlers.js`

IPC for terminals. Routes only. Every handler first decides who is calling:

- a **terminal page** (sender URL is `luma://terminal`): reaches only its own session, whatever id it sends;
- the **window chrome** (the dock, the menus, Settings): names sessions by id;
- anyone else (a web page): answered `null` on every channel.

All thirteen channels are handled channels (`ipcMain.handle`), including the one-way ones, so the registrar's channel
inventory stays one list.

| Channel | Page | Chrome |
|---|---|---|
| `core.terminal.attach` | its session | open or join by id |
| `core.terminal.input`, `resize`, `ack`, `restart`, `hold` | its session | by id |
| `core.terminal.profiles`, `settings` | yes | yes |
| `core.terminal.closeTab` | yes | no |
| `core.terminal.list`, `openTab`, `close`, `setSettings` | no | yes |

## Methods

- `new TerminalIpcHandlers({ viewers, service, settings, getTabViewManager, ipc })`, `register()`.
