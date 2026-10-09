# GitLog

`extensions/code-mode/terminal/GitLog.js`

Git calls for the commit-message style sample.

## Methods (static)

- `run(args, cwd)` -> stdout of `git <args>` (4 s timeout, 256 KB buffer,
  hidden window); rejects when git is missing or the folder is not a repository.
- `recentSubjects(cwd, count, runGit = run)` -> the last `count` non-merge
  subjects; `[]` without a cwd or on any failure.
