# AwkProgram

`core/shell/shellClassifier/rules/readOnly/AwkProgram.js`

Scans awk program text for constructs that leave the stream.

## Methods

- `AwkProgram.hazardIn(program)`: refusal phrase or `null`. Hazards: `system(`, gawk `|&` coprocesses,
  `"cmd" | getline`, `print`/`printf` followed by `>`, `>>` or `|` in the same statement, `@load`, `@include`.

## Why

Per POSIX awk and the gawk manual these are the ways a program writes files or runs commands. The print check errs
towards refusing (`print (a > b)` is refused). Patterns are linear so long arguments cannot stall the classifier.
Used by [StreamEditorProfiles](StreamEditorProfiles.md).
