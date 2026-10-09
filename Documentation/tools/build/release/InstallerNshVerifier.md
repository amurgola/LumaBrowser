# InstallerNshVerifier

`tools/build/release/InstallerNshVerifier.js`

`npm run verify:installer`: compiles `build/installer.nsh` the way electron-builder
does, in both passes (installer, then uninstaller with `-DBUILD_UNINSTALLER`),
with `makensis -WX`, so an unreferenced function (the 1.8.4 LumaStrStr failure)
shows up in seconds instead of at the end of a packaging run. The harness mirrors
the generator's header: StdUtils, the `${isUpdated}`-style flag macros, the
VERSION and APP_EXECUTABLE_FILENAME defines, MUI2. It uses the makensis and
nsis-resources that electron-builder cached (`%LOCALAPPDATA%\electron-builder\Cache\nsis`).

## Methods

- `new InstallerNshVerifier({ repoRoot, cacheDir, spawn, log, error })`.
- `run()`: 0 when both passes compile clean, 1 when a pass fails, 2 when the toolchain is missing.
- `harnessScript(resourcePlugins, outExe)`, `InstallerNshVerifier.flagMacros()`.
