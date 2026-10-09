# ReleaseAssetResolver

`core/shared/runtime/install/ReleaseAssetResolver.js`

Picks the release and asset an install downloads.

## Methods

- `new ReleaseAssetResolver(releaseClient)` with a
  [GithubReleaseClient](GithubReleaseClient.md).
- `resolve(repo, assetRegex, { prerelease })` resolves `{ release, asset }`:
  1. pre-release channel: newest release with a matching asset, if any
  2. else the latest release, if it has a matching asset
  3. else the newest other release with one (skipping the latest's tag)
  4. else throws `ASSET_NOT_FOUND` with `{ releasesUrl }`

## Why

The flagged latest release can be a pointer release or one whose CI job for
this platform failed. Walking back finds the freshest release that actually
ships for this host. The pre-release channel takes llama.cpp's freshest nightly,
usually several builds ahead of stable.
