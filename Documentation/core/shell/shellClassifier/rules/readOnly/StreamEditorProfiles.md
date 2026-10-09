# StreamEditorProfiles

`core/shell/shellClassifier/rules/readOnly/StreamEditorProfiles.js`

[ProfileGroup](ProfileGroup.md) for stream transformers.

- `SED`: `-i`/`--in-place` (also bundled, `-ni`, `-i.bak`, `--in`) writes; `-f`/`--file` is unverifiable; the
  script (every `-e`/`--expression`, else the first operand) is checked by [SedScript](SedScript.md).
- `AWK` (`awk`, `gawk`, `mawk`, `nawk`): `-f`/`-E`/`--file`/`--exec` and `-i`/`--include` are unverifiable, `-l`/
  `--load` executes, gawk `-o`/`-p`/`-d` (`--pretty-print`, `--profile`, `--dump-variables`) write report files,
  mawk `-W exec` is unverifiable; the program (every `-e`/`--source`, else the first operand) is checked by
  [AwkProgram](AwkProgram.md).
- `SORT`: `-o`/`--output` writes; `--compress-program` executes.
- `UNIQ`: a second operand is the output file (POSIX synopsis).
- `YQ`: `-i`/`--inplace`/`--in-place` edits in place; `-s`/`--split-exp` writes a file per document.

## Why

These tools print to stdout unless an option or their own program language says otherwise; both are checked.
