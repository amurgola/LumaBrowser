# SelectionClipboard

`extensions/desktop-integration/features/hotkeys/SelectionClipboard.js`

Reads and replaces the text selected in the foreground application through the
clipboard, leaving the user's clipboard as it was (text, HTML, RTF and images,
via desktop control's `ClipboardSnapshot`; other formats such as copied files
are lost). Luma never takes focus: keystrokes go to the window in front.

- `constructor({ keys, clipboard, sleep?, now? })`: `keys` is the platform's
  backend from [SelectionKeys](SelectionKeys.md): [NativeKeys](NativeKeys.md)
  (Windows), [MacKeys](MacKeys.md) or [LinuxKeys](LinuxKeys.md). Optional
  backend members change the flow:
  - `unavailableReason()`: a string stops both calls before any keystroke
    (`NO_PERMISSION`, e.g. macOS without Accessibility);
  - `copyMode === 'primary'`: the selection is read with `readPrimary()`, no
    keystroke and no clipboard change (Linux Wayland); the result has
    `primary: true`;
  - `readPrimary()` alone: when Ctrl+C left the clipboard unchanged (X11 has no
    change counter, so its "sequence" is the clipboard text), the primary
    selection decides whether something was selected;
  - `canPaste()` false: `pasteText` answers `UNSUPPORTED` with
    `noPasteReason` (Wayland without wtype or ydotool).
- `copySelection()` -> `{ success, text, hwnd }`: remembers the foreground
  window, `releaseModifiers()`, saves the clipboard, Ctrl+C, waits up to
  `COPY_TIMEOUT_MS` (800) for the sequence number to change, waits `SETTLE_MS`
  (40), reads, restores. Codes `UNSUPPORTED`, `NO_PERMISSION`, `NO_SELECTION`, `FAILED`.
- `pasteText(text, { hwnd })` -> `{ success, restored }`: if `hwnd` is no
  longer in front it is focused once (`FOCUS_LOST` when that fails), then the
  text is written, Ctrl+V sent, and after `PASTE_RESTORE_MS` (600) the previous
  clipboard is restored only if it still holds our text.
- `releaseModifiers()`: polls up to `MODIFIER_WAIT_MS` (1500) for the hotkey's
  modifiers to be released, then sends key-ups for any still held. Returns
  what was still held.

Both waits are bounded by a poll count as well as the clock.
