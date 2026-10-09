# SedScript

`core/shell/shellClassifier/rules/readOnly/SedScript.js`

Walks a sed script command by command (addresses, braces, labels, `a`/`i`/`c` text, `s` and `y` with any
delimiter and escapes) and reports the first hazard.

## Methods

- `SedScript.hazardIn(script)`: refusal phrase or `null`. Hazards: the `w`/`W` commands and the `s///w` flag write
  a file; the `e` command and the `s///e` flag run shell commands. Unknown commands and unterminated or malformed
  `s`/`y`/addresses are reported too.

## Why

sed reads unless its script says otherwise, and `-i` is not the only way to write. Failing closed on anything
unparseable means a misread can only make sed less trusted. Used by [StreamEditorProfiles](StreamEditorProfiles.md).
