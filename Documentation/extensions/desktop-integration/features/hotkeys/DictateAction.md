# DictateAction

`extensions/desktop-integration/features/hotkeys/DictateAction.js`

The `dictate` action of the [hotkeys feature](index.md): speech to text into
whatever text box has focus, in any application.

1. The first press opens the microphone
   ([Dictation](../../shared/Dictation.md) `begin`) and shows the Listening
   island ([HotkeyActivity](HotkeyActivity.md) `listening`).
2. The second press, Done on the island, or the time limit transcribes the
   recording (`finish`) and pastes the text with
   [SelectionClipboard](SelectionClipboard.md) `pasteText`: Ctrl+V into the
   window in front, with the user's clipboard saved and put back.
3. Cancel on the island drops the recording; nothing is transcribed or pasted.

The text goes to the window that is in front when dictation finishes, not the
one it started in, so the user can move the cursor while talking. Luma never
takes focus (the island cannot be focused), which is why this also works in
LumaBrowser's own text boxes.

A paste that fails (no keys backend permission, a platform that cannot paste)
leaves the text on the clipboard and says so: `onClipboard: true`.

Listening ends by itself after `MAX_LISTEN_MS` (5 minutes) and types what was
said up to then, so a forgotten session never keeps the microphone open.

## Methods

- `new DictateAction({ dictation, selection, clipboard, activity, foreground?, onError?, setTimeout?, clearTimeout? })`:
  `foreground()` returns the window in front (it only picks the island's
  monitor); `onError(actionId, message, shown)` gets a failure nobody is
  waiting for (Done on the island, the time limit).
- `supported`: the dictation service exists and the platform has a keys backend.
- `listening()`: the microphone is open and the next press types.
- `readiness()` -> `{ disabled, note }` for the shortcut hint: what the next
  press does, "Already running", or that speech recognition must be set up first.
- `toggle()`: `start()` or `finish()`; `BUSY` while the microphone is opening
  or the words are being written.
- `start()` -> `{ success: true, action: 'dictate', listening: true }`, or
  Dictation's failure (no island is shown then).
- `finish()` -> `{ success: true, action: 'dictate', text, chars, restored }`,
  or `{ success: false, error, code, shown }` (`EMPTY`, `CANCELED`, the paste's
  code).
- `cancel()`, `dispose()` (cancels a session in progress).
