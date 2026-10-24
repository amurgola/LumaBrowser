# WindhawkModChecker

`tools/windhawk/WindhawkModChecker.js`

Compile-checks a Windhawk mod with the locally installed Windhawk compiler
(`C:\Program Files\Windhawk`, or `WINDHAWK_ROOT`), using the arguments Windhawk
itself passes (read from its VS Code extension): `-std=c++23 -O2 -shared`, the
`UNICODE`, `WINVER`, `_WIN32_WINNT`, `_WIN32_IE`, `NTDDI_VERSION`,
`__USE_MINGW_ANSI_STDIO=0` and `WH_MOD` defines, `WH_MOD_ID` and
`WH_MOD_VERSION` from the header, the engine's `windhawk.lib`, `-include
windhawk_api.h`, `-target <triple>`, `-Wl,--export-all-symbols`, then the mod's
`@compilerOptions`. Runs in the `Compiler` folder, once per `@architecture`
target, into a temp DLL that is deleted afterwards, so link errors surface.
Nothing is installed into Windhawk.

## Methods

- `new WindhawkModChecker({ root?, canonicalClient?, spawn? })`.
- `available()`: the compiler exists. `compiler`: its path.
- `engineDir()`: `EnginePath` from `windhawk.ini` (UTF-16), else the newest `Engine\<version>`.
- `check(file)` -> `{ file, id, results: [{ target, ok, skipped?, output }], clientOk, clientMessage, ok }`.
  A target whose toolchain or engine library is not installed is skipped. A
  mod whose `luma_client` block differs from the canonical
  `integrations/windhawk/_shared/luma_client.inc.cpp` fails.
- `args(file, header, target, outFile)`: the clang arguments.
