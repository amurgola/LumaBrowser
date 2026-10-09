# ExtensionSourceFiles

`core/shell/extension-admin/ExtensionSourceFiles.js`

The extension code editor's file access, contained to one extension folder.

## Methods (all static)

- `list(extDir)` visible files (no dot files, no folders, no links) in editing
  order: `manifest.js`, `main.js`, `renderer.js`, `routes.js`, `mcp-tools.js`,
  then the rest alphabetically; `[]` when the folder cannot be read.
- `read(extDir, fileName)` UTF-8 text (throws when missing or refused).
- `write(extDir, fileName, content)` `{ success: true }`; creates the file when
  new. Content is written as `String(content)`.
- `resolve(extDir, fileName)` the absolute path, or throws. Used by both above.

## Containment

`extDir` comes from main ([ExtensionFolderResolver](ExtensionFolderResolver.md)
via [ExtensionEditorWindows](ExtensionEditorWindows.md)), never the renderer.
`fileName` must be a plain name directly inside it, matching what `list`
returns:

- non-empty string, else `A file path is required`;
- no `/`, `\`, `:` or NUL and not `.` or `..`, else
  `Path "<name>" escapes the extension folder`;
- [ContainedPath](../../shared/fs/ContainedPath.md)`.resolveWithin` (absolute
  paths refused) and `isImmediateChild`;
- an existing target's real path must be inside the folder's real path, and a
  dangling link is refused, so a link or junction pointing outside cannot be
  read or written through.

Bundled (non user-installed) extensions stay writable, as in legacy (a dev
feature; in a packaged build the bundled folder is inside the read-only asar and
the write fails with its own error).
