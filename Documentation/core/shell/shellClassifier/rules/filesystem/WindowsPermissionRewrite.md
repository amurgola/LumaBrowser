# WindowsPermissionRewrite

`core/shell/shellClassifier/rules/filesystem/WindowsPermissionRewrite.js`

[FileOperation](FileOperation.md) for `takeown` and `icacls`.

- `takeown` always changes ownership; `icacls` changes only with `/grant`, `/deny`, `/remove`, `/setowner`,
  `/reset`, `/restore`, `/setintegritylevel` or `/inheritance`. Plain `icacls PATH` and `/save` only read.
- Sweeps with `/T`.
