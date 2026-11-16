# DesktopRenderer

`extensions/desktop-integration/ui/DesktopRenderer.js`

Desktop Integration in the main window (behind `renderer.js`, which sets
`window.__ext_desktop_integration`): activates the
[DesktopSettingsTab](DesktopSettingsTab.md), the
[SpeechPlayer](SpeechPlayer.md), the
[DictationRecorder](DictationRecorder.md) and the
[DictationShortcutRow](DictationShortcutRow.md) in Settings > General.

## Methods

- `new DesktopRenderer({ tab?, player?, recorder?, dictationRow? })`.
- `activate(context)`: the shell's extension context `{ ipcBridge, slotManager, browserRenderer }`; a second activate starts over.
- `deactivate()`.
