# GgufCompanionPairer

`core/llm-server/scanner/GgufCompanionPairer.js`

Decides which weight models of a directory a companion (vision projector,
speculative drafter, detached MTP head) belongs to. Quants of one model form a
family; a companion pairs with a family only when the pairing is unambiguous.

## Methods

- `GgufCompanionPairer.pair(companion, groups)` returns `{ status, groups,
  candidates, reason }`. `companion` is `{ kind: 'mmproj'|'drafter'|'mtp', keys,
  architecture, parameterCount, sizeBytes, hinted }`; `groups` are the
  directory's weight groups `{ keys, role, architecture, parameterCount,
  sizeBytes }`. Candidates are the `main`-role groups (for a drafter: those it
  is a draft of). Then:
  - no candidate: `status: 'none'`;
  - one family among the candidates: `'paired'`, `groups` = every quant of it;
  - several families and exactly one linked by name: `'paired'` with that family;
  - otherwise `'ambiguous'`, `groups: []`, `candidates` listing every family's
    groups so the caller can record the ambiguity.
- `GgufCompanionPairer.families(groups)` clusters groups whose keys are linked.
- `GgufCompanionPairer.namesLinked(keysA, keysB)` equal keys, or one containing
  the other when the shorter is at least `MIN_LINK_KEY_LENGTH` (4) characters.
- `GgufCompanionPairer.isDraftOf(small, big, hinted = false)` same architecture
  (both known) and `sizeRatio` at most `DRAFT_MAX_RATIO` (0.2), or
  `DRAFT_HINTED_MAX_RATIO` (0.5) when the name or `general.type` says draft.
- `GgufCompanionPairer.sizeRatio(small, big)` by parameter count when both are
  known, else by bytes, else null.
- `GgufCompanionPairer.keysOf({ fileName, headerName, headerBaseName })` the
  normalised `general.basename`, `general.name` and `GgufFileName.familyKey`;
  `normaliseKey(raw)`.

## Why these ratios

A drafter is worth running when it is far smaller than the model it drafts for:
Qwen3-0.6B for Qwen3-32B is 2%, Llama-3.2-1B for Llama-3.1-70B is 1.4%. The 0.2
ceiling keeps a 14B beside a 32B (44%) or an 8B beside a 14B (57%) as models of
their own, since a user with both usually runs both. A publisher who names a
file `draft` has paired it on purpose, so the bar relaxes to half the size.
Bytes are a coarse stand-in for parameters (a Q8 draft beside a Q4 main reads
twice its real ratio), which is why the parameter count is derived from the
header wherever possible.

## Why ambiguity is recorded, not resolved

A projector that two unrelated model families could claim used to be attached
to both. Loading the wrong projector fails at inference time with no hint why.
Attaching to neither and recording `unpairedCompanions` on each candidate lets
the UI show the file and the user split the folder.
