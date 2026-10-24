# FileSelection

`extensions/desktop-integration/features/file-actions/FileSelection.js`

Validates and classifies the paths of a [file-actions](index.md) request.

- `inspect(paths, { allowNetwork, fsImpl, platform, uid })` resolves
  `{ items: [{ path, name, ext, kind, size }], errors: [{ path, error }] }`, or
  `{ error }` when the request is malformed (not a non-empty array of strings,
  or over `MAX_PATHS`, 100). Duplicates collapse (case-insensitive on Windows).
- `pathProblem(path, { allowNetwork, platform })`: refusals before any disk
  access: not absolute, a device path (`\\?\`, `\\.\`), a UNC path unless
  `allowNetwork`.
- Each path must exist, be a file or folder, and be readable by this user; on
  POSIX it must also be owned by this user.
- `kindOf(ext, isDirectory)`: `folder`, `image` (png, jpg, jpeg, gif, webp),
  `pdf`, `text` (the chat's text and code extensions plus `.text`, `.htm`) or
  `other`.
