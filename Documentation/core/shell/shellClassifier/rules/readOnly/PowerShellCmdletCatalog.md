# PowerShellCmdletCatalog

`core/shell/shellClassifier/rules/readOnly/PowerShellCmdletCatalog.js`

[ReadOnlyCatalog](ReadOnlyCatalog.md) for PowerShell.

- `READ_VERB_ALIASES` (gci, sls, gc, ...) and `PIPELINE_READERS` (Where-Object, Sort-Object, Out-String,
  Write-Output, Import-Csv, Start-Sleep, Read-Host, ...) are trusted with the shared PowerShell hazards.
- `CONTENT_READERS` (Get-Content, gc, cat, type) also refuse `-Wait`, which never exits.
- Tee-Object/tee write; ForEach-Object/foreach/% are refused because their script block is classified separately
  and may call .NET methods the parser cannot see.
- `judge(name, args)`: listed entries first, then [PowerShellVerbPolicy](PowerShellVerbPolicy.md).

## Why

Aliases and non-verb cmdlets cannot be trusted by verb, so they are listed; everything else follows the verb.
