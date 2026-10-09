# SharedHazards

`core/shell/shellClassifier/rules/readOnly/SharedHazards.js`

[OptionHazard](OptionHazard.md)s used by more than one profile.

- `OUTPUT_FILE`: `-o` / `--output` (sort, info, tree, base64/base32).
- `PAGER_PROGRAM`: `--pager` (ag, bat).
- `POWERSHELL_FILE_OUTPUT`: `-OutFile`, `-OutputPath`, `-OutputDirectory`, `-DestinationPath`, `-LogPath`.
- `POWERSHELL_BROWSER`: `-Online`, `-UseBrowser`. `POWERSHELL_REPAIR`: `-Repair`.
- `POWERSHELL_COMMON`: the three PowerShell hazards, applied to every trusted cmdlet.

## Why

Declared once so a fix to one spelling reaches every utility that shares it.
