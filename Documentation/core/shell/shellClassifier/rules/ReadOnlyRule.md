# ReadOnlyRule

`core/shell/shellClassifier/rules/ReadOnlyRule.js`

[ShellRule](../ShellRule.md) that decides whether one simple command only reads. It owns no tables itself: it asks
the read-only catalogs under [readOnly/](readOnly/ReadOnlyCatalog.md) in dialect order and returns the first answer.

## Methods

- `rule.assess({ name, args, dialect })` returns `{ tier: 'readonly', reason: null }` or `null` (the
  [ShellRule](../ShellRule.md) contract keeps readonly reasons null).
- `ReadOnlyRule.isReadOnly(name, args, dialect)` is `explain(...).readOnly`.
- `ReadOnlyRule.explain(name, args, dialect)` returns a [ReadOnlyVerdict](readOnly/ReadOnlyVerdict.md) whose
  reason names the entry, option or form that decided it (`sort -o writes its result to a file.`).
- `CATALOGS_BY_DIALECT`:
  - `posix`: [ToolchainCatalog](readOnly/ToolchainCatalog.md), [PosixUtilityCatalog](readOnly/PosixUtilityCatalog.md).
  - `powershell`: toolchains, [PowerShellCmdletCatalog](readOnly/PowerShellCmdletCatalog.md),
    [CmdBuiltinCatalog](readOnly/CmdBuiltinCatalog.md), POSIX.
  - `cmd`: toolchains, cmd, PowerShell, POSIX.
  - Any other dialect is treated as `posix`.

## Why

A command is read-only only when a catalog lists its name and its arguments do not turn it into a writer or a
runner. Unknown commands never read. The dialect's own catalog answers first so `sort /o` in cmd and `Sort-Object`
in PowerShell are each judged as what they are; Windows dialects still fall through to POSIX for git-bash tools.
The classifier adds one condition the rule cannot see: no file redirect and no leading assignments (see
[ShellRuleSet](../ShellRuleSet.md)), so shell output redirection is handed off rather than re-checked here.

## Design

Utilities are described by capability profiles ([UtilityProfile](readOnly/UtilityProfile.md)): an
[OptionGrammar](readOnly/OptionGrammar.md) that splits options the way the tool does, declarative
[OptionHazard](readOnly/OptionHazard.md)s (writes, executes, sends, changes-system, unverifiable, blocks), operand
limits for tools whose extra operand is an output file, required modes, and content inspectors
([SedScript](readOnly/SedScript.md), [AwkProgram](readOnly/AwkProgram.md)). Each POSIX entry was derived from the
utility's POSIX/GNU/BSD documentation; PowerShell cmdlets are trusted by verb with explicit write parameters
([PowerShellVerbPolicy](readOnly/PowerShellVerbPolicy.md)).
