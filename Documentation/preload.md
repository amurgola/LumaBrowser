# preload

`preload.js`

Preload of the main browser window (`index.html`). The window is sandboxed
(Electron's default), so a preload may only require `electron`: this stays one
self-contained CommonJS file (an allowed exception to one class per file).

## Exposed worlds

`electronAPI`, `permissionPromptAPI`, `llmSlotAPI`, `llmQueueAPI`, `tabAPI`,
`historyAPI`, `bookmarksAPI`, `viewDebugAPI`, `chromeOverlayAPI`,
`browserSettingsAPI`, `browserDataAPI`, `localApiAPI`, `sharingAPI`,
`imageServersAPI`, `windowAPI`, `modelStatusAPI`, `__LUMA_BOOT_START`,
`ipcBridge`. Each method maps 1:1 to an IPC channel (`invoke`, or `send` for
`tabAPI.setBounds`, `chromeOverlayAPI.*` and `permissionPromptAPI.respond`);
`on*` methods pass only the payload and return an unsubscribe function.
`ipcBridge` is the generic `invoke/send/on` passthrough extensions use.
