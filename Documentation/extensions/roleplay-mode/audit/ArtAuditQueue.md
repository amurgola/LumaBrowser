# ArtAuditQueue

`extensions/roleplay-mode/audit/ArtAuditQueue.js`

The queue of stored renders awaiting the vision art audit (`data.pendingArtAudit`).

## Methods

- `ArtAuditQueue.enabled(data)` false for `options.artAudit === false` or `RP_ART_AUDIT=0`.
- `ArtAuditQueue.add(data, item)` de-duplicates by kind, character and outfit;
  keeps the newest 6.
