# HotkeyActions

`extensions/desktop-integration/features/hotkeys/HotkeyActions.js`

The four actions of the [hotkeys feature](index.md). Every method resolves
`{ success, ... }` or `{ success: false, error, code }` and never throws.

- `constructor({ speech, handoff, selection, rewriter, region, clipboard, screenText?, options(), onError(id, message)?, now? })`.
  `options()` returns `{ instruction, modelRef, timeoutMs, autoSend, readScreen, screenTextModel }`.
- `run(id, source)`: `source` may carry `hwnd` and `frame` (a DIP rect), the
  window picked on the shortcut hint. Guards unknown (`UNKNOWN_ACTION`), unsupported
  (`UNSUPPORTED`) and already running (`BUSY`) actions, then dispatches.
  `read-selection` while speaking stops instead.
- `readSelection()`: needs `speech.available()` (`NO_TTS`); copies the
  selection, starts `speech.speak` without waiting for it, and opens the reading
  island (`activity.reading`). `speaking()` is the speech service's real
  playback (`playback().state !== 'ended'`); only a speech service without
  `playback()` falls back to 70 ms per character. A later speech failure goes
  to `onError` (marked shown when the island displays it). Nothing selected
  (`NO_SELECTION`) with `canReadScreen()`: the overlay is hidden
  (`activity.concealed`), the picked window is captured whole
  (`region.captureRect(frame)`) or the user drags a region, a busy island
  "Reading the text on screen" (with Stop) waits for
  [ScreenTextReader](ScreenTextReader.md), and the transcript is spoken
  (`source: 'region' | 'window'`). Without a model that can see,
  `NO_SELECTION` stands.
- `canReadScreen()`: `readScreen` is on and the screen text model can see images now.
- `readiness(id, { framed })` -> `{ disabled, note }` for the shortcut hint:
  what the key will do, or why it cannot (no voice, the AI chat not running,
  an empty clipboard, already running, not Windows).
- `stopSpeaking()`: `speech.stop()`.
- `rewriteSelection()`: copy, [SelectionRewriter](SelectionRewriter.md), paste
  back into the window the text came from, with a busy island
  (`activity.working`); Stop on the island discards the answer (`CANCELED`,
  nothing pasted). A failed paste leaves the answer on the clipboard
  (`onClipboard: true, text`). Failures the island showed carry `shown: true`.
- `activity` (constructor): [HotkeyActivity](HotkeyActivity.md), or a no-op;
  clipboard and screenshot handoffs flash "Sent to LumaBrowser".
- `clipboardToChat(source)`: short text as the prompt (4000 characters), long
  text as a `text` attachment, an image as a PNG attachment; `EMPTY_CLIPBOARD`
  when there is neither.
- `screenshotToChat(source)`: [RegionCapture](RegionCapture.md) (a drag, or
  `source.frame` captured whole as `window.png`) with the overlay hidden, then
  the handoff.
- `supported(id)`, `busy()`, `speaking()`, `dispose()`.
