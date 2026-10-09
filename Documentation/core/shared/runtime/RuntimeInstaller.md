# RuntimeInstaller

`core/shared/runtime/RuntimeInstaller.js`

Base class for every managed runtime installer. Installs a catalog entry from
its GitHub release (download, extract, companions, manifest), or through the
extension hooks that contributed it, and uninstalls it.

## Methods

- `new RuntimeInstaller({ catalog, userAgent, expectedKind, kindNoun, http, sysdeps, extractor })`
  - `catalog` a [RuntimeCatalog](RuntimeCatalog.md) (or anything with its
    methods); `getExtensionHooks(id)` is used when present.
  - `userAgent` sent on every GitHub and download request.
  - `expectedKind` the catalog `kind` this installer handles; `kindNoun` is
    the wording in the wrong-kind error (defaults to `expectedKind`).
  - `http` (axios), `sysdeps` (a [SysdepsChecker](SysdepsChecker.md)) and
    `extractor` ([ArchiveExtractor](install/ArchiveExtractor.md)) are test seams.
  - Throws when `catalog`, `userAgent` or `expectedKind` is missing.
- `expectedKind`, `userAgent` getters.
- `installRuntime(id, { runtimesRoot, onEvent, isCanceled, channel })`
  - unknown id: throws `Unknown runtime id: <id>`.
  - `acquisition: 'extension'` with hooks: calls `hooks.install({ entry,
    runtimesRoot, managedDir, onEvent, isCanceled, channel })` and returns its
    result; no install hook throws `NO_EXTENSION_INSTALLER`. The kind check is
    skipped for these, as before.
  - otherwise checks the kind and runs one
    [GithubRuntimeInstall](install/GithubRuntimeInstall.md), resolving
    `{ success: true, binaryPath, manifest, sysdeps }`.
  - `channel: 'prerelease'` installs the newest release that ships an asset for
    this host instead of the stable one.
  - `onEvent(type, payload)` gets `resolved`, `download`, `extract`,
    `finalize`; companion events carry `kind: 'companion'`.
- `uninstallRuntime(id, { runtimesRoot })` calls an extension `uninstall` hook
  (`{ success: true }`), else deletes `<runtimesRoot>/<id>`:
  `{ success: true, removed: true }` or
  `{ success: true, removed: false, reason: 'Nothing to remove.' }`.
- `fetchLatestRelease(repo)`, `fetchLatestPrerelease(repo)` read the release
  feed through [GithubReleaseClient](install/GithubReleaseClient.md).
- `resolvePrerelease(id)` previews the pre-release channel's pick as
  `{ tag, name, url, publishedAt, prerelease, asset: { name, size } }`, or
  `null` when the entry is not `github-release`, has no asset for this host,
  or no recent release carries one.

Typed failures are [RuntimeInstallError](install/RuntimeInstallError.md)s with
`code` and `detail`: `MANUAL_SOURCE_ONLY`, `NO_ASSET_FOR_PLATFORM`,
`ASSET_NOT_FOUND`, `NO_RELEASES`, `GITHUB_API_NON_200`, `EXTRACT_FAILED`,
`BINARY_NOT_FOUND_AFTER_EXTRACT`, `NO_EXTENSION_INSTALLER`.

## Subclassing

Each server binds the base to its catalog and identity:

```js
class LlmRuntimeInstaller extends RuntimeInstaller {
  constructor(catalog) {
    super({ catalog, userAgent: 'LumaBrowser-LLMServer', expectedKind: 'inference', kindNoun: 'inference' });
  }
}
```

Callers used to pass the unbound functions around
(`fetchLatestRelease` into the update checker). With a class, pass
`(repo) => installer.fetchLatestRelease(repo)`.

## Why

The LLM, image and speech-to-text servers and the chatterbox-voice add-on
install from GitHub releases and differ only in catalog, User-Agent and kind.
The extension-hook routing used to live only in the LLM wrapper; it moved here
(guarded by the catalog having `getExtensionHooks`) so the base serves every
server without a wrapper module.
