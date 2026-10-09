# GitChangeSet

`ide/vscode/src/GitChangeSet.js`

The changes about to be committed as one diff plus a file list: staged, else the working tree with untracked text files as new-file diffs (96000 chars total, 200 KB per untracked file).

## Methods

- `GitChangeSet.collect(repo)`: `{ diff, files, scope: 'staged' | 'working tree' | 'none' }`.
- `GitChangeSet.describe(change, repoRoot)`, `GitChangeSet.untrackedDiff(change, repoRoot)`,
  `GitChangeSet.pickRepository(api, arg, root, platform)`, `GitChangeSet.STATUS_WORD`.
