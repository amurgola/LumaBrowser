# CommandCwd

`core/shell/code-workspace/CommandCwd.js`

Resolves the working directory of a coding-agent shell command for
[CodeWorkspace](../CodeWorkspace.md)`.runCommand`.

## Methods

- `CommandCwd.resolve(fsOps, rootDir, requested)` returns `{ cwd }` or
  `{ refusal }`:
  - empty, `.`, `./` or a container root spelled absolutely -> the root;
  - otherwise [WorkspacePaths](WorkspacePaths.md)`.resolve`; an escape is
    `cwd refused: <reason>`;
  - a path that is not an existing directory is
    `cwd is not a directory in the project: <rel>`.
  A refusal has the CommandRunner result shape: `{ error, exitCode: null, output: '',
  timedOut: false, aborted: false, spillPath: null, durationMs: 0, shell: '', syntax: '' }`,
  and nothing is spawned.

## Why

The file tools refuse to leave the project; a command's cwd gets the same
containment, so the tool cannot be pointed at a directory outside it.
