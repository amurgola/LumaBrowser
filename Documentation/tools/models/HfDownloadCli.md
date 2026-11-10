# HfDownloadCli

`tools/models/HfDownloadCli.js`

Downloads one file of a Hugging Face repo with the app's own transfer from the
terminal: `npm run model:download -- <owner/repo> <file>` (`scripts/model-download.js`).
The transfer is `ModelDownload` over `ResumableDownload`: parallel chunks, a
resume from the `.partial`, the Hub token when one is set, the served size held
to the listing's, and the LFS sha256 verified on the finished bytes. A plain
curl loop gives none of that, and the Hub cut two of three such loops mid-file
on 2026-11-09.

## Options

- `<owner/repo> <file>` the repo id and the file path inside it.
- `--dir <path>` the models root (default `%USERPROFILE%/.lmstudio/models`);
  the file lands in `<dir>/<owner>__<repo>/<file>`, the folder shape the app's
  scanner lists.
- `--dest <path>` the exact destination instead.
- `--revision <rev>` (default `main`).

## Methods

- `new HfDownloadCli({ hub, download, log, now })` (test seams).
- `HfDownloadCli.parse(argv)`, `destination(options)`.
- `listing(options)` -> `{ size, sha256 }` from the repo tree (the LFS oid is
  the sha256; a non-LFS file has none).
- `execute(argv)` resolves `{ destPath, bytes, sha256 }`, null for `--help`;
  rejects on a missing file, a failed or canceled transfer. Progress lines
  are written at most every 5 s.
