# InstallRecord

`cli/lib/connect/InstallRecord.js`

The npm launcher's install record, `~/.lumabrowser/install.json`:
`{ version, asset, executable, installedAt }`.

## Methods (static)

- `InstallRecord.path()`.
- `InstallRecord.read()`: the parsed record, or `null` when missing or malformed.
- `InstallRecord.write(record)`: creates the folder, writes pretty JSON.

## Why

`lumabrowser start` writes it after a download; `luma` reads it
([AppExecutable](AppExecutable.md)) to start an installed app that is not running.
