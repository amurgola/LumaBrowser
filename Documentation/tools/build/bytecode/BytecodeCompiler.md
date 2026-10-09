# BytecodeCompiler

`tools/build/bytecode/BytecodeCompiler.js`

The electron-builder `afterPack` step (`scripts/compile-bytecode.js`):

1. locate app.asar ([AppAsarLocator](AppAsarLocator.md)); a missing archive is a
   hard error (silently shipping plain JS happened once),
2. extract it into a work dir,
3. delete `distributable: true` extensions (they ship as add-on zips),
4. classify with [SourceClassifier](SourceClassifier.md) and log the plain counts by reason,
5. compile the rest with [ElectronBytecodeRunner](ElectronBytecodeRunner.md) and
   replace each with a [BytecodeStub](BytecodeStub.md); a file that fails to
   compile stays plain and is logged,
6. repack with `build.asarUnpack` plus the [UnpackedSnapshot](UnpackedSnapshot.md)
   of what electron-builder had unpacked, then `uncacheAll()`.

The work dir sits next to the output (`dist/lumab-bytenode-*`), not in %TEMP%:
Windows Defender's ML heuristics quarantined
`core/shell/shellClassifier/PipeToShell.js` (Trojan:Script/ObfusScript.A!ml, a
false positive) out of %TEMP% mid-run. `LUMA_BYTECODE_WORKDIR` overrides the
parent; a parent with a dot folder (WSL's `~/.cache` build dir) falls back to the
OS temp dir because unpack globs cannot cross dot folders. The old archive is
deleted with `unlinkSync`: under Electron, `rmSync` stats through the patched fs,
which opens the archive and keeps it open.

## Methods

- `new BytecodeCompiler({ runner, asar, unpackPatterns, log })`.
- `compile(context)`: `context` is electron-builder's `{ appOutDir, packager }`.
- `BytecodeCompiler.readUnpackPatterns(packageJsonPath)`.
