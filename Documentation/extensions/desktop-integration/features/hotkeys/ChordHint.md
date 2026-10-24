# ChordHint

`extensions/desktop-integration/features/hotkeys/ChordHint.js`

The shortcut hint. While the user holds exactly the modifiers some bindings
share (Ctrl+Alt+Shift with the defaults) for `HOLD_MS` (320 ms, so a quick
chord never flashes it), [HotkeysFeature](HotkeysFeature.md) peeks the keys
they can press next on the activity overlay
([ActivityOverlay](../../shared/ActivityOverlay.md) `peek`), with the ring in
its armed mode (a flare, then a pulse). Releasing or changing the modifiers
unpeeks. A fired shortcut (`suppress()`) hides it and keeps it away until the
modifiers are released, so the action's own island takes over.

Electron has no global key-up event, so key state is polled: the modifier
virtual keys through `NativeKeys.heldModifiers()` (GetAsyncKeyState) every
`POLL_MS` (40 ms), Windows only, and only while the feature runs with
`shortcutHints` and `overlayIsland` on. The timer is `unref`'d.

## Methods

- `new ChordHint({ held, groups, onShow, onHide, onPoll?, now?, setInterval?, clearInterval? })`:
  `held()` -> virtual-key codes down now; `groups()` -> `{ 'Ctrl+Alt+Shift': [entry] }`;
  `onShow(modifiers, entries)`, `onHide()`; `onPoll()` runs on every poll while
  the hint is up (the [HintTarget](HintTarget.md) window pick).
- `start()`, `stop()` (hides), `suppress()`, `tick()` (one poll), `shown`.
- `ChordHint.comboOf(codes)`: `[0x11, 0x12, 0x10]` -> `Ctrl+Alt+Shift`
  (Win keys are `Super`).
- `ChordHint.split(accelerator)`: `Ctrl+Alt+Shift+R` -> `{ modifiers, key }`;
  `CommandOrControl` counts as Ctrl, `Plus` shows as `+`; null without
  modifiers or with one the poll cannot see (AltGr, Command).
