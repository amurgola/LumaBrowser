# SimulatedPack

`tools/build/verify/SimulatedPack.js`

Rehearses afterPack without electron-builder: stages the shippable top-level
entries of the project (everything except `NOT_SHIPPED`, dotfiles and `*.md`)
plus stub node_modules (koffi with a `.node`, axios, the MCP SDK) into
`<project>/tmp/asar-verify-*`, packs a fake `win-unpacked/resources/app.asar`
with the anchored unpack glob, runs [BytecodeCompiler](../bytecode/BytecodeCompiler.md)
with [FakeBytecodeRunner](FakeBytecodeRunner.md), then runs
[AsarBytecodeVerifier](AsarBytecodeVerifier.md). The scratch folder is always removed.

## Methods

- `new SimulatedPack({ projectRoot, asar, log, scratchParent, rows })`, `run()`.
