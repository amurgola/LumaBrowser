# GgufRoleTable

`core/llm-server/GgufRoleTable.js`

The one table that turns what a GGUF header says into the file's role:
`mmproj`, `embedding`, `reranker`, `draft`, `mtp` or `main`. The header is the
first line of defence; filename rules (`GgufFileName.roleHint`) are only the
fallback and live elsewhere.

## Methods

- `GgufRoleTable.headerRole({ architecture, generalType, poolingType, hasClipKeys, tensorScan })`
  returns `{ role, reason }`, or `{ role: null, reason }` when the header is
  not decisive (no architecture and no type). Checks run in this order and the
  first hit wins:
  1. projector: architecture in `PROJECTOR_ARCHES` (`clip`, `mmproj`), a
     projector `general.type` (`mmproj`, `projector`, `clip-vision`), or any
     `clip.*` key present;
  2. an explicit `general.type` in `GENERAL_TYPE_ROLES` (`embedding`,
     `reranker`, `draft`); `model` is the default and says nothing;
  3. `<arch>.pooling_type`: mean, cls or last (1, 2, 3) means embedding, rank
     (4) means reranker (`POOLING`, `POOLING_ROLES`);
  4. architecture in `ENCODER_ARCHES` (bert, nomic-bert, jina-bert-v2,
     xlm-roberta, roberta, modern-bert, gte, bge, e5, t5encoder, ...) means
     embedding;
  5. a tensor scan holding only nextn blocks (`GgufTensorLayout.isDetachedMtpHead`)
     means a detached MTP head;
  6. any other architecture is a `main` decoder.
- `GgufRoleTable.isKnownRole(role)`.
- `ROLES`, `PROJECTOR_ARCHES`, `ENCODER_ARCHES`, `GENERAL_TYPE_ROLES`, `POOLING`,
  `POOLING_ROLES`, `CLIP_KEY`.

## Why one table

Role detection used to be filename-only: a projector not named `mmproj-`, an
embedding model named plainly, or a renamed decoder all landed in the wrong
bucket. The header cannot be renamed. Keeping every architecture and type in one
place means a new encoder family or a new `general.type` value is one line.

The draft role has a second half the table cannot see: a small decoder beside a
larger one of the same architecture. That size comparison needs the directory and
lives in [GgufCompanionPairer](scanner/GgufCompanionPairer.md).
