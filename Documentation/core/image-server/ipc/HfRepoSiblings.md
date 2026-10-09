# HfRepoSiblings

`core/image-server/ipc/HfRepoSiblings.js`

Lists a HuggingFace model repo's files from its model metadata.

## Methods

- `HfRepoSiblings.fetch(repoId)` GETs `https://huggingface.co/api/models/<repoId>` (20 s timeout, 5 redirects, JSON) and returns the `siblings[].rfilename` list; network errors reject.

## Why

Kept on plain axios (not `HfHubClient`, which lives in llm-server and adds auth and a different timeout) to preserve the legacy request.
