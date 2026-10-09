# ArtAuditor

`extensions/roleplay-mode/audit/ArtAuditor.js`

Runs the vision art audit on queued renders, voiding bad ones.

## Methods

- `new ArtAuditor(chat)`; `auditPending(data)` true when an asset was voided.
  Skips during an active Lab run or without vision (queue kept); audits at most
  `min(2, profile.auditLimit)` per turn; one requeue for an unusable reply; a bad
  verdict clears the asset, drops `art.figures`, notes the ledger and bumps
  `options.artRevision`.
