# Build scripts

Thin entries under `scripts/` that electron-builder, npm scripts and CI call by
path. Each one only wires a `tools/build/` class (see [Packaging](../tools/build/Packaging.md)).

| Script | Calls | Notes |
|---|---|---|
| `scripts/after-pack.js` | [DistributableExtensionPruner](../tools/build/pack/DistributableExtensionPruner.md) | `build.afterPack`; exports the hook function. Direct use: `node scripts/after-pack.js <appOutDir>` |
| `scripts/build-hooks.js` | [BuildHooks](../tools/build/BuildHooks.md) | `build.onNodeModuleFile`; exports `onNodeModuleFile` |
| `scripts/verify-asar.js` | [AsarLayoutVerifier](../tools/build/verify/AsarLayoutVerifier.md) | `npm run verify:asar -- --asar <path>`. Exit 0 pass, 1 fail, 2 no `--asar` or crash |
| `scripts/build-extensions.js` | [AddonPackager](../tools/build/addons/AddonPackager.md) | `npm run build:extensions` |
| `scripts/build-docs-rag.js` | [DocsRagBuilder](../tools/build/docs-rag/DocsRagBuilder.md) | `npm run build:docs-rag`; `--out <file>`. Runs before electron-builder in CI and the local build scripts |
| `scripts/bump-version.js` | [VersionBumper](../tools/build/release/VersionBumper.md) | one step by default; `--to x.y.z` writes an explicit version; `--current` only reads. Prints `file: old -> new` (or `file: version`) lines and `VERSION=x.y.z` last. Exit 1 malformed version, 2 bad flag |
| `scripts/sync-prod.bat` | `bump-version.js --current` / `--to`, then `npm run sync:prod -- --verbose` | shows the version each file holds, prompts `Version to ship [current]:` (Enter keeps it, a new `x.y.z` is written to all three files first), then syncs. `sync-prod.bat 2.1.0` skips the prompt. Never commits or pushes; pauses only when double-clicked |
| `scripts/verify-installer-nsh.js` | [InstallerNshVerifier](../tools/build/release/InstallerNshVerifier.md) | `npm run verify:installer` |
| `scripts/build-local.bat` | `npm run build:win` | `--ci` runs `npm ci` first; prepares the winCodeSign cache; IDE steps `--if-present`; runs `build:docs-rag` |
| `scripts/build-linux.bat` | WSL + `scripts/build-linux.sh` | `--setup`, `--fast`, `--distro NAME` / `LUMA_WSL_DISTRO`; artifacts copied back to `dist\` |
| `scripts/build-linux.sh` | `npm run build:linux` | rsyncs to `~/.cache/lumabrowser-linux-build`; strips `/mnt/` from PATH; runs `build:docs-rag`; must stay LF |
