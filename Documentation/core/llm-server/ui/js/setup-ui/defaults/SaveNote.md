# SaveNote

`core/llm-server/ui/js/setup-ui/defaults/SaveNote.js`

The note a Setup card shows after a save, shared by the Chat defaults card (`#defaultsSaveNote`) and the Frameworks card (`#runtimesSaveNote`).

## Methods

- `new SaveNote(doc, { noteId, bodyId, pillId })`.
- `show(serverStopped)`: a plain "Saved." (`.defaults-saved`, `role="status"`) goes in the card head just before the pill, survives a re-render of the body and leaves after `SHOW_MS` (4 s); when the save stopped the running model, `STOPPED_TEXT` (`.defaults-save-note.stopped`) is prepended to the body and stays until the next render. Either replaces the other.

## Why

Moved out of DefaultsCard so the framework option saves say the same thing in the same place (`.card-head > .defaults-saved` in setup.css serves any card head).
