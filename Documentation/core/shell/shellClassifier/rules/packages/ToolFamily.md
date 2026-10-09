# ToolFamily

`core/shell/shellClassifier/rules/packages/ToolFamily.js`

Base class for the [PackagesRule](../PackagesRule.md) tool families. A family supplies a [VerbTable](VerbTable.md) and
answers whether a command carries a risk.

## Methods

- `buildTable()` -> the family's `VerbTable`; subclasses must implement it. `table` builds it once, lazily.
- `handles(tool)` -> whether the table lists the tool (after `tableKey`).
- `findRisk(tool, toolArgs)` -> a finding `{ effect, subject, scope, preview }` or `null`; override to add logic the
  table cannot express (see [DatabaseShellTools](DatabaseShellTools.md)).
- `tableKey(tool)` -> the key the tool is listed under; identity by default (see [CmdletTools](CmdletTools.md)).

## Why

Every family has the same shape, so PackagesRule treats them uniformly and the families stay pure data plus a few
named predicates.
