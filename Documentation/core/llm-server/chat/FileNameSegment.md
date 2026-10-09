# FileNameSegment

`core/llm-server/chat/FileNameSegment.js`

Turns an id into one safe path segment.

## Methods

- `FileNameSegment.from(value)`: every run of characters outside
  `[A-Za-z0-9._-]` becomes `_`, then the result is cut to 80 characters. A
  result made only of dots (`.`, `..`) has each dot replaced by `_`. Nullish
  input gives `''`; callers choose their own fallback (`_side` for traces, `_`
  for spills).

## Why

Conversation ids such as `agent:<id>:<stamp>` become file and directory names.
Dots inside a longer name are kept so existing files keep their names.

A segment of only dots is neutralised because the spill joins it as a whole
directory name and then deletes that directory recursively. In legacy,
`toolResultSpill.deleteFor('..')` (reachable from the conversation-delete IPC
with any id) resolved to the app base dir and would have removed models and
runtimes with it. Fixed here, with a test in `ToolResultSpill.test.js`.

Not [Slug](../../shared/text/Slug.md): slugs lowercase and change separators,
which would rename existing trace and spill files on disk.
