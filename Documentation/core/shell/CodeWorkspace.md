# CodeWorkspace

`core/shell/CodeWorkspace.js`

The coding agent's sandboxed workspace, behind `context.code` (the Vibe extension
builder, Code and Game chat modes). It is the one place allowed to write
generated files into the writable user-extensions directory; extensions never
touch `fs` or ExtensionManager directly. A workspace is either a build directory
directly under the root or an existing project folder. Every path crossing the
boundary is contained, every written file is validated, and every mutation of an
existing file must follow a read of the version on disk.

## Methods

- `new CodeWorkspace({ rootDir, fsOps, enforceObservation = true, commandRunner })`.
  `rootDir` (required) is the user-extensions dir. `fsOps` defaults to
  `ContainerFs.routed(fs)` (container paths go to `docker exec`). `enforceObservation: false`
  is the kill switch for the read-before-mutate guard (setting
  `core.shell.code.enforceObservation`). `commandRunner` defaults to a new CommandRunner.
- `CodeWorkspace.sanitizeId(name)`: the build id for a name (`Slug.from`).
- `openProject({ path })` -> `{ workspaceId: 'proj_<n>_<basename>', id, dir }`.
  Throws `openProject requires a path`, `Project path does not exist: <dir>`,
  `Project path is not a directory: <dir>`. Nothing is created.
- `createWorkspace({ kind = 'extension', name, overwrite })` -> `{ workspaceId: 'ws_<n>_<id>', id, dir }`.
  The dir is an immediate child of rootDir. Throws `Cannot derive a valid id from name "<name>"`
  and `A workspace/extension "<id>" already exists` (unless `overwrite`, which empties it).
- `getWorkspace(workspaceId)` -> `{ id, dir, kind, name }`; throws `Unknown workspace "<id>"`.
- `validate(relPath, content)` -> CodeValidator result, nothing written.
- `writeFile(id, relPath, content)` (async) -> `{ ok, path, bytes, validation, diagnostics, summary }`.
  Written even when invalid (`ok` is the validation verdict). A guard refusal is
  `{ ok: false, path, error, code }` and writes nothing.
- `writeBytes(id, relPath, bytes, { overwrite })` (async) -> `{ ok: true, path, bytes, created }`,
  no validation; refuses `FS_IS_DIRECTORY` and, without `overwrite`, `FS_EXISTS`.
- `editFile(id, relPath, edits)` -> Promise of `{ ok: true, path, edits, bytes, valid, summary }`,
  or `{ ok: false, path, error[, code] }` (`File not found: <rel>. Use write to create it.`,
  a guard refusal, or the FileEdit error). A path escape throws synchronously.
- `readFile(id, relPath)`, `readLines(id, relPath, { offset = 1, limit })` ->
  `{ content, startLine, endLine, totalLines }`. Both record the read.
- `grep(id, opts)`, `find(id, opts)`, `listDir(id, relDir)`: [CodeSearch](CodeSearch.md).
- `projectMap(id)`: [ProjectMap](ProjectMap.md). `contextFiles(id)`: [ProjectContextFiles](ProjectContextFiles.md)`.collect`.
- `listFiles(id)` -> `[{ path, bytes }]` sorted ([WorkspaceFileList](code-workspace/WorkspaceFileList.md)).
- `manifestSanity(id)` -> `{ ok, errors, manifest }` ([ManifestSanity](code-workspace/ManifestSanity.md)).
- `discardWorkspace(id)`: a build dir is deleted -> `{ ok: true }`; a project is
  only forgotten -> `{ ok: true, forgotten: true }`; unknown -> `{ ok: false }`.
  The workspace's read records go with it.
- `runCommand(id, { command, cwd, ...spec })` -> the CommandRunner result plus
  `cwd` (relative, `.` for the root). A bad cwd returns a refusal result without
  spawning ([CommandCwd](code-workspace/CommandCwd.md)).
- `commandShell(kind)`: `CommandRunner.resolveShell(kind || 'auto')`, for the tool doc.

## Parts

- [WorkspacePaths](code-workspace/WorkspacePaths.md): containment (safety boundary).
- [WorkspaceRegistry](code-workspace/WorkspaceRegistry.md): open workspaces by id.
- [ReadGuard](code-workspace/ReadGuard.md): the read-before-mutate guard over a FileObservation ledger.
- [WorkspaceMutations](code-workspace/WorkspaceMutations.md): writes and edits in one per-file queue.
- [ManifestSanity](code-workspace/ManifestSanity.md), [WorkspaceFileList](code-workspace/WorkspaceFileList.md),
  [CommandCwd](code-workspace/CommandCwd.md).

One CodeWorkspace is shared per ExtensionManager, so the sub-agent fan-out shares
one ledger and one queue: a child that reads then edits is fine, and a child
editing a file only a sibling read is told the file moved under it.
