# WorkspaceFileList

`core/shell/code-workspace/WorkspaceFileList.js`

Recursive listing of every file in a workspace, for [CodeWorkspace](../CodeWorkspace.md)`.listFiles`.

## Methods

- `WorkspaceFileList.collect(fsOps, dir)` returns `[{ path, bytes }]` with
  slash-separated relative paths, sorted by path. A missing directory lists as
  empty. Uses the workspace's fs, so container projects list through docker.
