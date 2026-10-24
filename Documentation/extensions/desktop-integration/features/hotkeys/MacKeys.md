# MacKeys

`extensions/desktop-integration/features/hotkeys/MacKeys.js`

The selection actions' keyboard and clipboard parts on macOS, with the
[NativeKeys](NativeKeys.md) interface, over [MacApi](MacApi.md). An app's pid
stands in for the window handle.

- `supported`: true on macOS.
- `unavailableReason()`: null when Luma may post events
  (`systemPreferences.isTrustedAccessibilityClient`); otherwise `NO_PERMISSION`
  text pointing at System Settings > Privacy & Security > Accessibility. The
  first call per run asks macOS to show its permission prompt. Without the
  permission macOS drops posted events silently, so this is checked first.
- `heldModifiers()`: CGEventFlags mapped to the shared codes (Shift 0x10,
  Control 0x11, Option 0x12, Command 0x5b).
- `sendCombo('copy' | 'paste')`: Cmd+C or Cmd+V (ANSI key codes 0x08, 0x09), a
  down and an up each carrying only the Command flag, so the user's held keys
  do not leak in. `releaseKeys()` is therefore a no-op.
- `clipboardSequence()`: `NSPasteboard.changeCount`.
- `foregroundWindow()` (frontmost app's pid), `focusWindow(pid)` (activates it),
  `windowTitle(pid)` (the app's name).

The key codes are physical ANSI positions: on a layout where Cmd+C is not the
key in the C position, copying may not trigger.
