# RedirectRole

`core/shell/shellClassifier/syntax/RedirectRole.js`

Says what a redirection does with its target.

## Methods

- `RedirectRole.of(op, target)`: `duplication` when the operator ends in `&` and the target is a number or `-`
  (`2>&1`, `>&-`); `input` for `<` forms other than `<>`; otherwise `output` (`>`, `>>`, `>|`, `<>`, `&>`, `*>`,
  `>&file`). An fd prefix on `op` is ignored.
- Constants `OUTPUT`, `INPUT`, `DUPLICATION`, `DUPLICATED_FD`.

## Why

POSIX 2.7: only output and read-write forms can create or change a file; duplications touch no file.
