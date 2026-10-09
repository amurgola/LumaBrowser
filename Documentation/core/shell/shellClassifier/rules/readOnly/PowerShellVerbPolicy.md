# PowerShellVerbPolicy

`core/shell/shellClassifier/rules/readOnly/PowerShellVerbPolicy.js`

Trusts cmdlets by approved verb.

## Methods

- `PowerShellVerbPolicy.judge(name, args)`: `null` unless the verb is in `READ_VERBS` (compare, convertfrom,
  convertto, format, get, measure, resolve, search, select, show, test, trace); refuses `EXCEPTIONS`
  (Format-Volume, Get-Credential, Test-Credential, Get-WindowsUpdateLog, Measure-Command, Trace-Command); otherwise
  judges with `TRUSTED`, which refuses the [SharedHazards](SharedHazards.md) PowerShell parameters (`-OutFile`,
  `-Online`, `-Repair`, ...).
- `PowerShellVerbPolicy.hasReadVerb(name)`.

## Why

Modules add Get-/Test- cmdlets constantly, so a name list goes stale; the verb carries the intent. The exceptions
are cmdlets whose documented behavior contradicts their verb, and the parameter check catches the read cmdlets that
can still write a file or open a browser.
