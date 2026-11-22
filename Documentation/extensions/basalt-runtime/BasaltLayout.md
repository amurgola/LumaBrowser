# BasaltLayout

`extensions/basalt-runtime/BasaltLayout.js`

The paths inside one unpacked Basalt release archive.

## Fields

`new BasaltLayout(binaryPath, platform = process.platform)`:
`binaryPath`, `binDir` (its folder), `archiveDir` (the archive's top folder,
`bin`'s parent), `venvDir` (`<archiveDir>/.venv`), `requirementsPath`
(`<archiveDir>/requirements.txt`) and `venvPython` (`.venv/Scripts/python.exe`
on Windows, `.venv/bin/python` elsewhere).

## Why

`basalt serve` uses a `.venv` at the archive's top folder when it is there
(upstream `docs/platforms.md`). The installer, the venv step and the detector
all need the same paths.
