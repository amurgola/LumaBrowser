# HfRepoSiblings

`core/image-server/ipc/HfRepoSiblings.js`

Lists a HuggingFace model repo's files for the repo-paste import's recipe resolver.

## Methods

- `HfRepoSiblings.fetchListing(repoId)` pins the repo through [HfPinnedRepo](../../llm-server/models/HfPinnedRepo.md) (the token goes with the request; the tree is read at the resolved commit) and resolves `{ revision: { requested, sha, pinned, fallbackReason }, files: [{ path, size, sha256 }], names }`. Unsafe paths are never listed. A gated or private repo rejects with the `HF_ACCESS_DENIED` access error; other failures reject as they are.
- `HfRepoSiblings.fetch(repoId)` the `names` of `fetchListing`, for callers that only pattern-match file names.

## Why

The legacy `siblings` call was anonymous and unpinned, so a gated repo listed nothing and a recipe's three downloads could read two commits. The pinned listing gives [HfRepoRecipes](HfRepoRecipes.md) sha URLs and each file's size and digest for the transfer to verify against.
