# ModelDownloadRequest

`core/llm-server/ipc/ModelDownloadRequest.js`

Normalises a `downloadModel` request into the files to fetch.

## Methods

- `ModelDownloadRequest.from(args)` returns `{ url, file, parts, totalBytes }`:
  - `hf` resolves through [HfModelInput](HfModelInput.md) (and throws its messages),
    else `url` and `filename` are taken as given;
  - `parts` with more than one entry (URL strings or `{ url, filename | file }`)
    become `[{ url, file }]`, each file the given name or the URL's basename, and
    the first part becomes `url` / `file`; otherwise `parts` is null;
  - `totalBytes` a number (0 when absent);
  - every present file name (the direct `filename`, each part's name or URL
    basename) must pass [SafeRepoPath](../../shared/download/SafeRepoPath.md)`.fileName`:
    a folder, drive letter, absolute path, `..` or an empty part name throws
    `DOWNLOAD_UNSAFE_PATH`. An absent direct `filename` stays absent so the
    downloader can report the missing input.

## Why

Each shard keeps its Hub basename (`...-0000i-of-0000n.gguf`) so the scanner rolls
the set back into one model and llama.cpp loads from part 1. The names come from
the renderer, so they are checked here before they touch a path.
