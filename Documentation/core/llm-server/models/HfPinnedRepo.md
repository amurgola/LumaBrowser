# HfPinnedRepo

`core/llm-server/models/HfPinnedRepo.js`

One pull's view of a Hub repo, pinned to a single commit, with every file's
size and sha256.

## Methods

- `HfPinnedRepo.pin(repoId, { revision = 'main', signal })` resolves the
  revision through [HfHubClient](HfHubClient.md)`.resolveRevision`, reads
  `/api/models/<repo>/tree/<sha>?recursive=true` (3 attempts with backoff) and
  returns an instance. Throws `HF_BAD_ID`, `HF_NOT_FOUND` or the
  `HF_ACCESS_DENIED` access error. When the revision cannot be pinned for a
  non-auth reason, the branch name is used and `revision.pinned` is false with
  `fallbackReason` set.
- `HfPinnedRepo.fromTree(repoId, revision, tree)` builds one from a tree
  listing; entries that are directories or fail
  [SafeRepoPath](../../shared/download/SafeRepoPath.md) are left out.
- Instance: `repoId`, `revision` `{ requested, sha, pinned, fallbackReason }`,
  `files` `[{ path, size, sha256 }]` (size and sha256 from the LFS pointer when
  there is one; `sha256` null for plain blobs), `sha`, `pinned`, `totalBytes`,
  `urlFor(path)` (`resolve/<sha>/...?download=true`), `fileFor(path)`
  (`{ path, size, sha256, url }` or null), `describe()` (a copy of `revision`).

## Why

Every file URL used to be `resolve/main/...`, so a sharded GGUF or an MLX
snapshot could straddle a push and mix two commits. Pinning once per pull and
building every URL from the sha makes a multi-file download read one snapshot,
and the same tree read supplies the expected size and digest the transfer is
verified against. [HfMlxRepo](HfMlxRepo.md), [HfGgufRepo](HfGgufRepo.md),
[ModelFileDownloader](../ipc/ModelFileDownloader.md) and
[HfRepoSiblings](../../image-server/ipc/HfRepoSiblings.md) all pin through it.
