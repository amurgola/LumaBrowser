# DesktopRenderer

`extensions/desktop-integration/ui/DesktopRenderer.js`

Desktop Integration in the main window (behind `renderer.js`, which sets
`window.__ext_desktop_integration`): activates the
[DesktopSettingsTab](DesktopSettingsTab.md) and the
[SpeechPlayer](SpeechPlayer.md).

## Methods

- `new DesktopRenderer({ tab?, player? })`.
- `activate(context)`: the shell's extension context `{ ipcBridge, slotManager, browserRenderer }`; a second activate starts over.
- `deactivate()`.
