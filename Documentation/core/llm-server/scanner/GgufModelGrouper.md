# GgufModelGrouper

`core/llm-server/scanner/GgufModelGrouper.js`

Collapses raw `.gguf` files into logical models, one directory at a time, using
the roles [GgufRoleResolver](GgufRoleResolver.md) read from the headers and
pairing companions through [GgufCompanionPairer](GgufCompanionPairer.md).

## Methods

- `GgufModelGrouper.group(files, rootDir, roles = new Map())` returns model
  entries (see [LlmModelsScanner](../LlmModelsScanner.md)), per directory:
  - each file's role is `roles.get(path)` (`{ role, roleSource, roleReason,
    nameHint, header }`), else `roleOf(file)`: the filename fallback
    (`GgufFileName.roleHint`, else `main`);
  - `mmproj`, `draft` and `mtp` roles are companions (`COMPANION_KIND`);
    `<stem>-NNNNN-of-NNNNN.gguf` shards roll into one `weights` model sorted by
    shard index (always weights: companions never ship split; the first shard's
    role is the group's); any other file is its own `weights` model named by its
    stem, carrying `role` (`main`, `embedding`, `reranker`), `roleSource` and
    `roleReason`;
  - a single-file `main` decoder that `GgufCompanionPairer.isDraftOf` a
    same-architecture sibling (at most 20% of its parameters, or 50% when the
    name says draft) is demoted to a drafter (`roleSource: 'header'`, reason
    `<arch> decoder at N% of <stem>`);
  - each companion is paired once: `paired` attaches it to every quant of the
    one family (`mmproj`, `drafter`, `mtp` arrays and `totalBytes`); `ambiguous`
    attaches it to nothing and appends `{ kind, path, name, sizeBytes,
    modifiedAt, reason }` to `unpairedCompanions` on every candidate model;
  - an unpaired or ambiguous companion still shows: a drafter as runnable
    weights with `role: 'draft'`, a projector or head as an `mmproj-only` /
    `mtp-only` entry, each carrying `pairing: { status, reason, candidates }`.
- `GgufModelGrouper.roleOf(file, roles)`, `relativeDirectory(rootDir, dir)`
  (`.` for the root), `stemOf(name)`.
- `SHARD` regex, `COMPANION_KIND`, `COMPANION_ONLY_KIND`.

Weight and companion file refs carry `modifiedAt`, which the header cache keys on.

## Why

Roles used to come from the file name alone (`mmproj-` prefix, `dflash`,
`mtp-`), so a plainly named projector listed as a model and a renamed decoder
vanished into companions. The header decides now; names are the fallback.

LM Studio ships one projector per directory, often shared by two quants, so
one family takes every companion in reach. A folder holding two unrelated models
and one projector used to attach it to both; loading the wrong projector fails
at inference with no hint why, so now neither gets it and both record it. A
detached MTP head (unsloth/Qwen3.8-27B-GGUF) pairs like a projector; a head is
never loadable alone, unlike a drafter, so it never falls back to weights.
Companions never pair across directories.
