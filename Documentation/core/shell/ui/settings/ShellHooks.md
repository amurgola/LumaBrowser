# ShellHooks

`core/shell/ui/settings/ShellHooks.js` (ES module)

The shell-page functions the extension loader and Settings panels call back into, injected by the shell entry with the legacy window functions as fallback.

## Methods

- `new ShellHooks({ toast, markSaved, closeSettings, rerunSetupWizard })` (all optional).
- `toast(message, kind)`: hook, else `window.settingsToast`, else
  `window.addLogEntry(message, 'error' | 'success')`, else the console.
- `markSaved(control, ok, errorMessage)`: hook or `window.gsMarkSaved`.
- `closeSettings()`: hook or `window.closeSettings`, else hides `#settingsModal`.
- `rerunSetupWizard()`: hook or `window.__rerunSetupWizard`.
- `ShellHooks.hideSettingsModal()`: removes `active` from `#settingsModal`
  without the shell's close listeners (what launching a chat mode or the wizard did).

## Globals

Reads `window.settingsToast`, `window.addLogEntry`, `window.gsMarkSaved`, `window.closeSettings`, `window.__rerunSetupWizard` (fallbacks only).
