# DictationShortcutRow

`extensions/desktop-integration/ui/DictationShortcutRow.js`

The Dictation section the extension adds at the end of Settings > General
(`#gsSecDictation`): one row, "Dictation shortcut", with a button that shows
the shortcut and takes a new one, and a Clear button.

The section is only shown while dictation can run. It asks
`ext.desktop-integration.hotkeys.dictation`
([HotkeysFeature](../features/hotkeys/HotkeysFeature.md) `dictationStatus`)
and shows itself when the answer is `supported` and `ready`: speech
recognition is set up (a runtime and a model, see
[Dictation](../shared/Dictation.md)) and the platform can paste. With the
hotkeys feature switched off the channel does not exist and the section stays
hidden. It asks again each time Settings opens (`settings:open`) and when the
extension announces a change, so it appears after voice setup without a
restart.

Setting a shortcut:

1. Click the button: it reads "Press the keys..." and every key press on it
   belongs to the capture (nothing else in the window reacts).
2. Press a key or a combination. [ShortcutCapture](ShortcutCapture.md) turns it
   into the shortcut text; a key that cannot be used says why under the row.
3. Esc alone, or leaving the button, keeps the current shortcut.

The value is saved with `ext.desktop-integration.setFeatureSetting('hotkeys',
'binding.dictate', value)`, the same setting the Desktop Integration tab
shows, and the row flashes the shell's "Saved" badge (`window.gsMarkSaved`).
A shortcut that could not be registered (another program holds it) is shown
with the reason: "Ctrl + Alt + Shift + D is not active: Already in use by
another program."

The settings styles give buttons and rows a display of their own, so parts are
hidden with both the `hidden` attribute and `display: none`.

## Methods

- `new DictationShortcutRow({ doc?, mac? })`.
- `activate(ipcBridge)`: mounts the section into `#generalSettings`; does
  nothing in a window without it.
- `refresh()`: reads the status, shows or hides the section, paints the row.
- `deactivate()`: removes the section and its listeners.
