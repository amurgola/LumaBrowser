# WorkspaceRegistry

`core/shell/code-workspace/WorkspaceRegistry.js`

The open workspaces of one [CodeWorkspace](../CodeWorkspace.md), keyed by workspaceId.

## Methods

- `add(prefix, { id, dir, kind, name })` returns `<prefix>_<n>_<id>` with a running
  sequence, so a rebuilt workspace over the same directory never reuses an old handle.
- `get(workspaceId)` returns the record or throws `Unknown workspace "<id>"`.
- `find(workspaceId)` returns the record or null. `remove(workspaceId)`.
- `WorkspaceRegistry.isProject(record)`: `kind === 'project'` (`PROJECT_KIND`).
