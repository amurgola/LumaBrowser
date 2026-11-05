# ApiPortSetting

`ui/shell/settings/general/ApiPortSetting.js`

The local API port with its live URL and Copy button; rejected ports revert.
While the gateway should be up but is not (its port is held by another
program), the row's `#gsApiStatus` line says "Not running: port N is in use by
<holder>" (holder from [PortConflict](../../../../app/ready/PortConflict.md)
when known) and offers a "Use port N+1" button that saves that port and shows
the restart note.

## Methods

- `install()`, `load()`, `updateDisplay()`, `savedPort`.
- `renderStatus(status)`: paints the status line from
  `electronAPI.getApiStatus()`; `ApiPortSetting.problem(status)` is the pure
  `{ text, suggestedPort } | null` behind it (null when listening, disabled or
  unknown).

## Globals

Reads `window.electronAPI.getApiPort`, `setApiPort`, `getApiStatus`.
