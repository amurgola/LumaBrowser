# RoleplayPostProcessor

`extensions/roleplay-mode/pipeline/RoleplayPostProcessor.js`

The mode's server-side reaction after each assistant turn.

## Methods

- `new RoleplayPostProcessor(chat, logger)`;
  `process({ content, assistantMessageId, meta, emit, setMeta })` never throws.
  Reconcile (migration, speakers, audit, stage call), save and announce, then
  draw: skip an unchanged moment, try the fast composite, else run the image phase.
  A cancel ends with `mode:image-fail { canceled: true }`.
