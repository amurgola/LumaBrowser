# JournalFiles

`extensions/roleplay-mode/journal/JournalFiles.js`

Where a conversation's turn log lives and how it is appended to. Two files per
conversation in the app's data folder under `roleplay-logs`:
`<conversation id>.md` (the readable log) and `<conversation id>.jsonl` (every
event in full, one JSON object per line). Outside the app (unit tests, the
Roleplay Lab CLI) the folder is `luma-roleplay-logs` in the system temp
directory.

- `dir()`, `paths(conversationId)` -> `{ md, jsonl }`, `exists(conversationId)`.
- `append(conversationId, event, markdown)` writes both, synchronously; a
  failure returns false and never throws.
