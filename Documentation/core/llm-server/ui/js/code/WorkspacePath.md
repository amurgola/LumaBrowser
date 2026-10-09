# WorkspacePath

`core/llm-server/ui/js/code/WorkspacePath.js`

Workspace-relative path helpers ('/'-separated keys relative to the folder).

## Methods

- `relativeTo(root, path)`: a tool's path as a key; absolute paths must be
  under the root (case-insensitive); `null` outside it or with `..`.
- `normalizedRoot(root)`, `parentOf(path)`, `baseName(path)`, `join(dir, name)`, `isWithin(path, dir)`.
