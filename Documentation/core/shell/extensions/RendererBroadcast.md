# RendererBroadcast

`core/shell/extensions/RendererBroadcast.js`

Best-effort push of an extension lifecycle event to every open window.

## Methods

- `RendererBroadcast.send(channel, payload)` sends to every live window's
  webContents; a no-op outside an Electron main process.
- `RendererBroadcast.INSTALLED` (`core.shell.extensionInstalled`, payload `{ id, name }`)
  and `RendererBroadcast.DELETED` (`core.shell.extensionDeleted`, payload `{ id }`).
