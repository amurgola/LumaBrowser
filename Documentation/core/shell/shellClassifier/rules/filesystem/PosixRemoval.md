# PosixRemoval

`core/shell/shellClassifier/rules/filesystem/PosixRemoval.js`

[FileOperation](FileOperation.md) for coreutils removal: `rm`, `rmdir`, `unlink`, `shred`, `truncate`.

- Targets: non-flag words (`--` ends options, so `rm -rf -- /` targets `/`).
- Reaches targets: `rm` with `-r`/`-R`/`--recursive` or `-f`/`--force`.
- Unconditional: `rm --no-preserve-root` (GNU rm documents it only for removing `/`).
- Sweeps: recursive, a `*` target, or any `shred` (destroys contents beyond recovery).
