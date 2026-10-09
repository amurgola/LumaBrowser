# ArchiveExtractor

`core/shared/runtime/install/ArchiveExtractor.js`

Extracts a zip or tar archive into a directory with fallbacks.

## Methods

- `ArchiveExtractor.extract(archivePath, destDir, { globs })` resolves
  `{ method: 'tar' | 'extract-zip' | 'powershell-expand-archive' }`:
  1. `tar -xf <archive> -C <dest>` (with `--wildcards <globs>` on Linux)
  2. a `.zip` that tar refused: the bundled `extract-zip`
  3. Windows only: PowerShell `Expand-Archive`
  Otherwise throws `EXTRACT_FAILED` naming each strategy's reason; a non-zip
  reads `Extraction failed (tar exit: <reason>).`

## Why

bsdtar (Windows 10+, macOS) reads zip and tar.gz; GNU tar (every Linux) reads
tar.gz only, which used to fail every Linux sd.cpp install because those ship
as zips. `globs` keeps a 400 MB NCCL redist from dumping headers into the
runtime dir. Commands run through
[SysdepsCommandRunner](../SysdepsCommandRunner.md) with a 5 minute timeout;
reasons are capped at 500 characters.
