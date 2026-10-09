# renderer.js (classic)

`extensions/roleplay-mode/renderer.js`

Roleplay Mode's settings-page renderer. Classic-script exception
(distributable extension): one self-contained classic file.

## What it does

Sets `window.__ext_roleplay_mode = { activate(context) }` (no `deactivate`, as
in legacy). `activate` takes `context.ipcBridge` and
`context.containers.settingsContainer` (the manifest's `settings.html`), asks
`context.slotManager.setCallback('settings-tab', 'roleplay-mode',
'onActivate', ...)` to re-read the flag whenever the tab opens, and wires
`#ext-rp-labEnabled`: loaded from `ext.roleplay-mode.getLabFlag` (`{ enabled }`),
saved with `ext.roleplay-mode.setLabFlag(checked)`, and `#ext-rp-labNote`
shown while enabled.

## Globals

Writes `window.__ext_roleplay_mode`; reads `document`.
