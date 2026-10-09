# FileEventBuilder

`core/llm-server/chat/triggers/file/FileEventBuilder.js`

Builds the event a file trigger run sees and its run row stores.

## Methods

- `FileEventBuilder.build(kind, dir, absPath, stat)` (async) returns
  `{ receivedAt, event: kind, path, relPath, name, ext, dir, size, mtime }`
  plus, unless `kind` is `remove`, `isText` and, for text, `preview` (the first
  `PREVIEW_BYTES`, 8 KB) and `previewTruncated`. An empty file is text with an
  empty preview; a binary file (NUL in the prefix) has no preview; a file
  unreadable right now has neither (the run can retry with
  `read_trigger_file`). Every string passes through `TriggerPayload.sanitize`.
- `FileEventBuilder.forPath(dir, candidate)` (async): a `synthetic: true` add
  for an existing file inside the folder (`set_sample`, "Use a file"). Throws
  for a path outside the folder, a missing file or a non-file.
- `FileEventBuilder.looksText(buffer)`.

## Why

File names and contents are untrusted input to a model prompt, hence the
sanitising; the preview lets most runs act without reading the file again.
