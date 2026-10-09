# NtfySettingsTab

`extensions/ntfy-notifier/ui/NtfySettingsTab.js`

The Ntfy Notifications settings tab in the main window: server, default topic,
optional username and password, and a "Send test" button. Every field
autosaves on change; the password is write-only, so the tab only learns
whether one is stored.

## Methods

- `activate(context)`: registers the `settings-tab` slot (`ntfy-notifier`,
  label `Ntfy Notifications`, reloading on tab activation) through
  `context.slotManager`, wires the fields and loads the settings over
  `context.ipcBridge`. Does nothing more when the slot manager returns no
  container.
- `deactivate()`: nothing to tear down.

Behaviour: a `change` on any field sends `saveSettings` with server, topic and
username, plus the password only when one was typed (an empty field keeps the
stored one); after a saved password the field clears and its placeholder
reads `Stored (type to replace)`. Status text: `Saved`, `Sending...`,
`Sent. Check your device.` clear after 2.5 s; errors (`Could not save`,
`Send failed` or the handler's message) stay, styled `luma-form-err`.

## IPC

`ext.ntfy-notifier.getSettings`, `ext.ntfy-notifier.saveSettings(patch)`,
`ext.ntfy-notifier.sendTest` (see [NtfyNotifierExtension](../NtfyNotifierExtension.md)).

## Globals

None. The entry `renderer.js` writes `window.__ext_ntfy_notifier`
(`{ activate, deactivate }`), the shell's extension renderer contract.
