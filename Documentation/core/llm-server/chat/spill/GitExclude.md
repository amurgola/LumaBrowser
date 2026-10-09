# GitExclude

`core/llm-server/chat/spill/GitExclude.js`

Adds a pattern to a git work tree's private exclude list once.

## Methods

- `GitExclude.addOnce(root, pattern, comment)`: when `<root>/.git` is a
  directory and no line of `.git/info/exclude` already equals `pattern`,
  appends `# <comment>` and `pattern` (with a leading newline if the file did
  not end in one), creating `info/` if needed. Best-effort: never throws.

## Why

`.git/info/exclude` is local to the clone and untracked, so app scratch dirs
(the `.luma/` spill folder) stay out of `git status` without editing the
user's tracked `.gitignore`. A `.git` file (worktrees, submodules) is not a
directory and is skipped.
