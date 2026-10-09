# ReadOnlyCatalog

`core/shell/shellClassifier/rules/readOnly/ReadOnlyCatalog.js`

Base class for a family of profiles indexed by lowercased name.

## Methods

- `knows(name)`, `names()`.
- `judge(name, args)`: the profile's verdict, or `null` when the name is not listed (the next catalog is asked).
- Construction throws when a name is listed twice.

## Subclasses

[PosixUtilityCatalog](PosixUtilityCatalog.md), [PowerShellCmdletCatalog](PowerShellCmdletCatalog.md),
[CmdBuiltinCatalog](CmdBuiltinCatalog.md), [ToolchainCatalog](ToolchainCatalog.md).

## Why

A `Map` is immune to `constructor`/`__proto__` names, and the duplicate check stops a later entry silently winning.
