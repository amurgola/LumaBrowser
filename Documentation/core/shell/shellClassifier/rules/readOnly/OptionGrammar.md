# OptionGrammar

`core/shell/shellClassifier/rules/readOnly/OptionGrammar.js`

How one utility spells its options, and a scanner that splits arguments the same way the tool would.

## Styles

- `GETOPT` (default): `-abc` bundles and `--long[=value]`. Letters in `valueShort` take the rest of the bundle or
  the next word (`-nroout` is `-n -r -o out`). `valueLong` names take the next word. `abbreviatesLong` accepts GNU
  unambiguous prefixes (`--out=x`).
- `WORDS`: single-dash words that never bundle (`find -exec`, `xxd -cols`, `nvidia-smi -pm`); `valueWords` take the
  next word.
- `SLASH`: cmd switches, `/x` or `-x`, lowercased, optional `:value`.
- `POWERSHELL`: `-Name` or `-Name:value` parameters (form `param`); no value consumption.

`--` ends options (except in PowerShell); a lone `-` is an operand.

## Methods

- `scan(args)` returns [ScannedArgs](ScannedArgs.md).
- `namesLong(given, full)`: exact, or a prefix when the grammar abbreviates.

## Why

Hazard detection on raw words misses bundles (`rg -iz`, `sed -ni`, `sort -nro out`) and abbreviations
(`sort --compress-p=sh`), and wrongly fires on option values (`rg -e -z`). Parsing first fixes both.
