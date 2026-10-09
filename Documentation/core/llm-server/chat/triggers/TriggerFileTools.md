# TriggerFileTools

`core/llm-server/chat/triggers/TriggerFileTools.js`

The run-scoped file tools of a file-kind trigger's run, injected as
`extraTools` and never in the global catalog.

## Methods

- `TriggerFileTools.build(trigger, event = null)` returns `[]` when the
  trigger's `source.dir` is missing; otherwise
  [read_trigger_file](file-tools/ReadTriggerFileTool.md) (defaulting to
  `event.path`), plus [write_file_in_watch_dir](file-tools/WriteWatchDirFileTool.md)
  when `source.allowWrite` is set. Each entry is `{ name, description,
  inputSchema, handler, mutating? }`.

## Why

Every path is resolved and pinned under the trigger's watch folder with
[WatchFolder](file/WatchFolder.md)`.resolveInside`; nothing outside it is
readable or writable. Writing is a separate permission because it is part of
what a trigger test vouches for (the config hash includes `allowWrite`).
