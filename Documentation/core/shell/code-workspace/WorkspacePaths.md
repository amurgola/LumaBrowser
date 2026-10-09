# WorkspacePaths

`core/shell/code-workspace/WorkspacePaths.js`

Path containment for [CodeWorkspace](../CodeWorkspace.md). Every path the agent
names is resolved strictly inside the workspace root or refused. This is a
safety boundary; never loosen it.

## Methods (static)

- `resolve(baseDir, relPath)`: [ContainedPath](../../shared/fs/ContainedPath.md)`.resolveWithin`
  (throws `A file path is required`, `Path must be relative, got "..."`,
  `Path "..." escapes the workspace`). For a container base
  ([ContainerPath](../ContainerPath.md)) an absolute POSIX path such as
  `/app/src/x.py` is read against the container root first; one outside it (or
  the root itself) throws `"<p>" is outside the project root <root>; use run_command for files elsewhere in the container`.
- `resolveDir(baseDir, relDir)`: like `resolve`, but empty or the container root
  spelled absolutely means `baseDir` (directory listings).
- `namesRoot(baseDir, ref)`: true when `ref` is a container project's own root
  spelled absolutely (`/app` or `/app/` for a root of `/app`).
- `childDir(rootDir, id)`: `<rootDir>/<id>`, which must be an immediate child;
  throws `Invalid workspace id "<id>"`.
- `relative(baseDir, abs)`: slash-separated relative path on every platform.

## Why

Inside a container the model sees, and writes, absolute POSIX paths. Mapping them
onto the container root lets the same lexical containment check decide whether
they are in the project. The check is lexical, as ContainedPath documents.
