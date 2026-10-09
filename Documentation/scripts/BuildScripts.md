# Build scripts

Thin entries under `scripts/` that electron-builder, npm scripts and CI call by
path. Each one only wires a `tools/build/` class (see [Packaging](../tools/build/Packaging.md)).

| Script | Calls | Notes |
|---|---|---|
| `scripts/compile-bytecode.js` | [BytecodeCompiler](../tools/build/bytecode/BytecodeCompiler.md) | `build.afterPack`; exports the hook function. Direct use: `node scripts/compile-bytecode.js <appOutDir>` |
| `scripts/bytecode-compiler/main.js` + `package.json` | [BytecodeJob](../tools/build/bytecode/BytecodeJob.md) | a tiny Electron app; env `LUMA_BYTECODE_JOB` / `LUMA_BYTECODE_RESULT`; hardware acceleration off, no window |
| `scripts/build-hooks.js` | [BuildHooks](../tools/build/BuildHooks.md) | `build.onNodeModuleFile`; exports `onNodeModuleFile` |
| `scripts/_verify-bytecode-asar.js` | [SimulatedPack](../tools/build/verify/SimulatedPack.md), [AsarBytecodeVerifier](../tools/build/verify/AsarBytecodeVerifier.md) | no args: rehearsal; `--asar <path>`: real build. Exit 0 pass, 1 fail, 2 crash |
| `scripts/build-extensions.js` | [AddonPackager](../tools/build/addons/AddonPackager.md) | `npm run build:extensions` |
| `scripts/build-docs-rag.js` | [DocsRagBuilder](../tools/build/docs-rag/DocsRagBuilder.md) | `npm run build:docs-rag`; `--out <file>`. Runs before electron-builder in CI and the local build scripts |
| `scripts/bump-version.js` | [VersionBumper](../tools/build/release/VersionBumper.md) | prints `file: old -> new` lines and `VERSION=x.y.z` last |
| `scripts/verify-installer-nsh.js` | [InstallerNshVerifier](../tools/build/release/InstallerNshVerifier.md) | `npm run verify:installer` |
| `scripts/build-local.bat` | `npm run build:win` | `--ci` runs `npm ci` first; prepares the winCodeSign cache; IDE steps `--if-present`; runs `build:docs-rag` |
| `scripts/build-linux.bat` | WSL + `scripts/build-linux.sh` | `--setup`, `--fast`, `--distro NAME` / `LUMA_WSL_DISTRO`; artifacts copied back to `dist\` |
| `scripts/build-linux.sh` | `npm run build:linux` under `xvfb-run` | rsyncs to `~/.cache/lumabrowser-linux-build`; strips `/mnt/` from PATH; runs `build:docs-rag`; must stay LF |
