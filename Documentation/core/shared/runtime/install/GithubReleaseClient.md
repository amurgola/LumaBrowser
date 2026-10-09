# GithubReleaseClient

`core/shared/runtime/install/GithubReleaseClient.js`

Reads a repo's GitHub release feed for the runtime installer.

## Methods

- `new GithubReleaseClient({ userAgent, http = axios })`.
- `latestRelease({ owner, repo })`
  1. `GET /releases/latest`; on a release, follows a `nightly-tag.txt`
     pointer to `/releases/tags/<tag>` when present (falls back to the pointer
     release itself if the tag is malformed or unreachable)
  2. on 404 (or 200 without assets) lists `?per_page=10` and returns the
     newest non-draft non-prerelease, else the first; an empty list throws
     `NO_RELEASES` with `{ repoUrl, note }`
  3. any other status throws `GITHUB_API_NON_200` with `{ status, body }`
- `latestPrerelease({ owner, repo })` newest non-draft of `?per_page=10`;
  throws `GITHUB_API_NON_200` or `NO_RELEASES`.
- `newestReleaseWithAsset({ owner, repo }, assetRegex, skipTag)` scans
  `?per_page=30` newest first, skipping drafts and `skipTag`, and returns
  `{ release, asset }` or `null` (also `null` on any request failure).

API calls send the User-Agent, `Accept: application/vnd.github+json` and
`X-GitHub-Api-Version: 2022-11-28`, with a 15 s timeout; 4xx answers are read,
not thrown.

## Why

ggml-org flags binary-less semver releases (`vX.Y.Z`) as latest; their only
asset names the `b<N>` build that has binaries. Following it keeps install and
update check pointed at the same real release.
