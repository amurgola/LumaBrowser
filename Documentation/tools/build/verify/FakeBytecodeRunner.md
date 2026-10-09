# FakeBytecodeRunner

`tools/build/verify/FakeBytecodeRunner.js`

Stand-in for [ElectronBytecodeRunner](../bytecode/ElectronBytecodeRunner.md):
writes `FAKE-JSC <name>` instead of bytecode so the bytecode step runs without
Electron. Records the `compiled` inputs.

## Methods

- `compile(jsFiles)`: always returns an empty failure map.
