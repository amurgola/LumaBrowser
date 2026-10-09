# PathPicker

`core/shared/ipc/PathPicker.js`

Shows a native open dialog for an IPC caller and normalises every cancel case
into one result.

## Methods

- `PathPicker.pick(event, dialogOptions, { useFocusedWindow = false })` returns
  `{ canceled: true }` or `{ canceled: false, paths: string[] }`.
  `dialogOptions` go to `dialog.showOpenDialog` unchanged. The dialog is parented
  to `BrowserWindow.fromWebContents(event.sender)`; when there is none it is
  unparented, or parented to the focused window if `useFocusedWindow` is set. A
  throwing window lookup degrades to unparented. A dialog rejection propagates
  (the caller's `IpcEnvelope.enveloped` reports it).

## Why

`canceled` is not reliably true on every platform when the user dismisses the
dialog, so cancel is `canceled || !filePaths || filePaths.length === 0`.
Missing one of the three fails on one OS only.

The focused-window fallback is opt-in because modal parentage changes dialog
behaviour (notably on macOS). Eight legacy call sites used no fallback; only
the chat attachment picker used it.
