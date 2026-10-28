# Packaging

How the app becomes an installer. Everything here mirrors the legacy repo's release pipeline; the only intended difference before cutover is that nothing reaches the update feed from CI.

## electron-builder config (package.json "build")

Identical to legacy except where the rebuild's layout needs it:

- `appId` `com.lumabyte.lumabrowser`, `productName` `LumaBrowser`,
  `publish` generic `https://lumabyte.com/install/` (kept for cutover; it is what
  electron-builder writes into `resources/app-update.yml`).
- `afterPack` `./scripts/after-pack.js` ([DistributableExtensionPruner](pack/DistributableExtensionPruner.md)),
  `onNodeModuleFile` `./scripts/build-hooks.js` ([BuildHooks](BuildHooks.md)).
- `extraResources`: `cli` (bin, lib, package.json, README.md, LICENSE) to
  `resources/cli`, `ide/dist` (JetBrains plugin, VS Code vsix) to `resources/ide`,
  `dist/docs-rag` (`docs-rag.db`, the documentation knowledge base
  [DocsRagBuilder](docs-rag/DocsRagBuilder.md) writes) to `resources/docs-rag`.
  A missing source folder is skipped with a warning.
- `files`: everything except dev folders. Added for the rebuild: `!Documentation`,
  `!tools`, `!tmp`.
- `asarUnpack`: legacy's list (mcp-server.js, core/shell/McpServer.js, koffi,
  @koromix, ripgrep, web-tree-sitter, tree-sitter-powershell, the MCP SDK and
  axios with its dependency chain) plus the three `core/shell/mcp-stdio/*.js` files the
  stand-alone MCP server now requires. Natives electron-builder unpacks on its
  own (better-sqlite3, @napi-rs/canvas) are kept by the afterPack repack.
  Preloads and workers are not unpacked: Electron loads them through the archive.
- Targets: win nsis + portable (no arch in the config: the host's, or the CLI's
  `--x64` / `--arm64`; CI builds both), linux AppImage + deb (x64), mac dmg + zip
  (hardened runtime, notarize, `build/entitlements.mac.plist`); NSIS includes
  `build/installer.nsh` and shows `LICENSE`.

## Plain source

The app ships as plain JavaScript inside app.asar: no bytecode compilation and
no obfuscation, for the app or for add-ons. The afterPack step only removes
`distributable: true` extensions ([DistributableExtensionPruner](pack/DistributableExtensionPruner.md));
[AsarLayoutVerifier](verify/AsarLayoutVerifier.md) checks the packed layout.

## Static files

`build/installer.nsh`, `build/entitlements.mac.plist`, `assets/icon.ico`,
`assets/tray-icon.png` (tray), `icon/icon.png` (window and installer icon),
`LICENSE`, `THIRD-PARTY-LICENSES` (both shown in Settings), `.gitattributes`
(`*.sh` LF for WSL), `.npmrc` (`legacy-peer-deps`), `.dockerignore`: copied
byte-identical from legacy.

## Commands

| Command | What |
|---|---|
| `npm run build:win` / `build:linux` / `build:mac` / `build:portable` | electron-builder per platform |
| `npm run build:extensions` | add-on zips ([AddonPackager](addons/AddonPackager.md)) |
| `npm run build:docs-rag` | the documentation knowledge base, `dist/docs-rag/docs-rag.db` ([DocsRagBuilder](docs-rag/DocsRagBuilder.md)); CI and the local build scripts run it before electron-builder |
| `npm run verify:asar -- --asar <app.asar>` | verify a real build's layout ([AsarLayoutVerifier](verify/AsarLayoutVerifier.md)) |
| `npm run verify:installer` | compile installer.nsh in both NSIS passes |
| `node scripts/bump-version.js [--to x.y.z | --current]` | one version step, an explicit version, or a read-only report ([VersionBumper](release/VersionBumper.md)) |
| `scripts\sync-prod.bat [x.y.z]` | prompt for the version to ship (writes it to the three package files), then `npm run sync:prod` |
| `scripts\build-local.bat [--ci]` | Windows installer + portable, CI's windows leg |
| `scripts\build-linux.bat [--setup] [--fast]` | AppImage + deb inside WSL |

`scripts/build-local.bat` pre-extracts electron-builder's winCodeSign archive
(its two macOS symlinks need Developer Mode otherwise). The IDE plugin steps run
with `--if-present` until the IDE port adds their npm scripts.

## CI (.github/workflows/build.yml)

Manual dispatch, or a published GitHub release. Matrix ubuntu-latest / windows-2022 (x64) /
windows-11-arm (arm64: native, so `npm ci` installs the win32-arm64 prebuilds; the portable's
`artifactName` is overridden on the CLI to carry `-arm64`) / macos-latest (arm64 only),
Node 24 (better-sqlite3 13, used by the docs index build, needs 22+), electron-builder cache, `npm ci`, optional IDE plugins, unsigned unless
the signing secrets are set, three build attempts, then
`verify-asar.js --asar` on the leg's output and an artifact upload. A
separate `addons` job builds the add-on zips once. Every build runs with
`--publish never`. On a release event the build checks out the release's tag and
a `release` job downloads every artifact, folds the Windows arm64 leg's `latest.yml`
into the x64 one ([UpdateManifestMerger](release/UpdateManifestMerger.md); electron-updater
reads one manifest per platform) and attaches the files to that release
(`gh release upload --clobber`, so a re-run replaces them).

## Docker (docker/, docker-compose*.yml)

Debian + Xvfb + fluxbox + x11vnc + noVNC + supervisord running the app from
source as user `luma`, data in `/data`, REST on 3000, noVNC on 6080. Owner
decision: the Keygen license gate is gone (no `LUMA_LICENSE_KEY`, no
`validate-license.js`); `LUMA_VNC_PASSWORD` is still required.
