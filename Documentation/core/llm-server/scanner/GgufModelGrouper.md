# GgufModelGrouper

`core/llm-server/scanner/GgufModelGrouper.js`

Collapses raw `.gguf` files into logical models, one directory at a time.

## Methods

- `GgufModelGrouper.group(files, rootDir)` returns model entries (see
  [LlmModelsScanner](../LlmModelsScanner.md)), per directory:
  - `mmproj-`/`mmproj_` prefixed files are projectors, `dflash` files drafters,
    `mtp-`/`mtp_` prefixed files detached MTP heads (`GgufFileName.isMtpHead`);
  - `<stem>-NNNNN-of-NNNNN.gguf` shards roll into one `weights` model sorted by
    shard index; any other file is its own model named by its stem;
  - every projector, drafter and head attaches to every weight model in the
    directory, and `totalBytes` includes them;
  - drafters alone in a directory list as weights; projectors and heads alone
    list as `mmproj-only` / `mtp-only` entries.
- `GgufModelGrouper.relativeDirectory(rootDir, dir)` (`.` for the root),
  `GgufModelGrouper.stemOf(name)`.
- `SHARD`, `MMPROJ`, `DRAFTER` regexes.

## Why

LM Studio ships one projector per directory, often shared by two quants. A
detached MTP head (unsloth/Qwen3.8-27B-GGUF) is published once for every quant,
so it pairs like a projector; a bare "mtp" elsewhere in a name is the grafted
convention, where the file is the model. A head is never loadable alone, unlike a
drafter, so it never falls back to weights. Companions never pair across directories.
