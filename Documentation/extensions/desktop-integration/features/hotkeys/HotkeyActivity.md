# HotkeyActivity

`extensions/desktop-integration/features/hotkeys/HotkeyActivity.js`

What the hotkey actions show on the desktop activity overlay
([ActivityOverlay](../../shared/ActivityOverlay.md)). A no-op when the overlay
is missing or both `overlayIsland` and `overlayRing` are off.

- **Reading aloud** follows [Speech](../../shared/Speech.md)'s real playback
  (`onState`): "Reading aloud" with Pause, "Paused" with Resume (the ring dims),
  plus Stop and Continue in LumaBrowser, and the progress line. It ends with
  "Finished reading" for a moment, at once when stopped, or with the error
  when speech failed.
- **Continue in LumaBrowser** opens a new chat with the selection attached as
  a text file (in the composer, not sent); reading carries on.
- **Rewrite** shows a busy "Rewriting selection" island with Stop; then
  "Rewritten", or the failure.
- **Clipboard / screenshot to chat** confirm with "Sent to LumaBrowser"
  (island only, no ring).
- **Failures** show the action's "Couldn't ..." title and the reason, with
  Dismiss, instead of a native notification.

## Methods

- `new HotkeyActivity({ overlay, speech, handoff, options, stopSpeaking, log? })`:
  `options()` -> `{ island, ring }`.
- `enabled()`.
- `reading({ text, hwnd })`: call right after `speech.speak()` started; the
  island tracks that utterance only. A new reading replaces the old one.
- `working({ action, title, hwnd, onStop })` -> `{ canceled(), finish(result, doneTitle) }`.
- `flash({ action, result, title, hwnd })` -> whether it showed anything.
- `dispose()`. Static `snippet(text)` (one line, at most `DETAIL_CHARS`).
- `concealed(fn)`: hides the overlay at once (`overlay.conceal()`), waits
  `CONCEAL_MS` (60 ms) for the compositor, runs `fn` (a screen capture) and
  paints the overlay back.
