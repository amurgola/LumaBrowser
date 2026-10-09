# ConfigFile

`core/shell/harness-connections/ConfigFile.js`

Reads, atomically writes and deletes other programs' configuration files.

## Methods

- `ConfigFile.readTextOr(file, fallback)` returns the file text, or `fallback`
  when the file does not exist. Any other read error is thrown.
- `ConfigFile.writeAtomic(file, contents)` creates parent folders, writes a
  temp sibling (`<file>.<pid>.<ms>.tmp`) and renames it over the target.
- `ConfigFile.remove(file)` deletes the file; a missing file is not an error.

## Why

Harness configs are files the user also edits by hand, so a half-written file
must never be left behind. Windows refuses to rename over a file another process
holds open; in that case the write falls back to writing in place and deletes
the temp file. The original rename error is thrown only if the target still does
not exist afterwards. `remove` lets disconnect delete files LumaBrowser created.
