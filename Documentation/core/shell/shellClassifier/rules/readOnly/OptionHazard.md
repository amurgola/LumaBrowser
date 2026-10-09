# OptionHazard

`core/shell/shellClassifier/rules/readOnly/OptionHazard.js`

A declarative dangerous option: its spellings (`short` letters, `long` names, `words`, PowerShell `params`), its
`effect` and a `why` phrase. An optional `when(value)` narrows it (curl `-X` only for non-GET methods).

## Effects

`writes`, `executes`, `sends`, `changes-system`, `unverifiable` (loads a program or config the rule cannot read),
`blocks` (never exits). An unknown effect throws.

## Methods

- `findIn(scanned, grammar)`: first covered option or `null`. Long names honour the grammar's abbreviation rule;
  `params` reuse [PowerShellArgs](../../PowerShellArgs.md) abbreviation.
- `describe(option)`: `"<spelling> <why>"`.

## Why

One shape describes every utility's danger, so the same hazard (an `-o/--output` file, a `--pager` program) is
declared once in [SharedHazards](SharedHazards.md) and reused.
