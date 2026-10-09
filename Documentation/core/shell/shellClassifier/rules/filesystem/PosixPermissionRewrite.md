# PosixPermissionRewrite

`core/shell/shellClassifier/rules/filesystem/PosixPermissionRewrite.js`

[FileOperation](FileOperation.md) for recursive `chmod`, `chown`, `chgrp`.

- Reaches targets and sweeps only with `-R`/`--recursive` (lowercase `-r` is chmod's "remove read").
- Every positional is a target; mode and owner words never classify as protected paths.
