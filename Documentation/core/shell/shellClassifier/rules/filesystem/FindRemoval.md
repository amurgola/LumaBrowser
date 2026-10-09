# FindRemoval

`core/shell/shellClassifier/rules/filesystem/FindRemoval.js`

[FileOperation](FileOperation.md) for `find` used as a deleter: `-delete`, or `-exec`/`-execdir`/`-ok`/`-okdir` running
`rm`, `unlink`, `rmdir` or `shred`.

- Targets: the starting points, after `-H`/`-L`/`-P` and before the first test, action, `(` or `!`.
- Protected kinds: root only. `find / -delete` is forbidden; `find ~ -name '*.pyc' -delete` is a normal targeted
  cleanup and only sweeps.
