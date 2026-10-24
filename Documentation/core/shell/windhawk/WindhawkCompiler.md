# WindhawkCompiler

`core/shell/windhawk/WindhawkCompiler.js`

Compiles a Windhawk mod with Windhawk's bundled clang and the exact arguments
Windhawk's editor uses. Output goes to a temp folder as the user; copying it
into Windhawk is [WindhawkElevation](WindhawkElevation.md)'s job.
`tools/windhawk/WindhawkModChecker.js` builds its check arguments with `args`
too, so the check and the install never drift apart.

## Methods

- `WindhawkCompiler.args({ modId, version, file, target, outFile, engineDir, compilerOptions })`:
  `-std=c++23 -O2 -shared`, the `UNICODE` / `WINVER` / `WH_MOD` defines,
  `WH_MOD_ID` and `WH_MOD_VERSION`, the engine's `<32|64|arm64>\windhawk.lib`,
  `-x c++ <file> -include windhawk_api.h -target <target>
  -Wl,--export-all-symbols -o <outFile>`, then the mod's `@compilerOptions`.
- `WindhawkCompiler.dllName(modId, version, random?)`:
  `<modId>_<version>_<6 random digits>.dll`, as Windhawk names it.
- `new WindhawkCompiler(install, { run?, tmpDir?, random? })`: `install` is
  [WindhawkLocator](WindhawkLocator.md) `locate()` output.
- `compile({ source, header, modId })` -> `{ dir, dllName, outputs: [{ target, subfolder, file }] }`:
  one build per header target; a target whose toolchain or engine library is
  missing is skipped; a failing target throws with the compiler output. The
  caller removes `dir`.
- Statics: `ENGINE_SUBFOLDERS`, `DEFINES`, `TIMEOUT_MS`.
