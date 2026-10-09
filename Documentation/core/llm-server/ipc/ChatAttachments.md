# ChatAttachments

`core/llm-server/ipc/ChatAttachments.js`

The chat composer's attachments: the paperclip picker and dropped files.

## Methods

- `new ChatAttachments({ reader?, pickPath? })` (defaults `new AttachmentReader()`, `PathPicker.pick`).
- `pick(event)` a multi-select open dialog parented to the sender's window, else the
  focused window: `{ canceled: true, files: [] }` or `{ files }`.
- `readDropped(paths)` `{ files }` for the accepted paths.
- `ChatAttachments.acceptedPaths(paths)` absolute, non-empty strings only, at most
  `DROP_MAX_FILES` (20); anything not an array is none.
- `ChatAttachments.filters()` the dialog filters (text and code, images, PDF, all files).

## Why

Dropped paths arrive over IPC rather than from a dialog, so the main process holds
its own line on what it reads. The focused-window fallback keeps the attach dialog
window-modal rather than app-modal.
