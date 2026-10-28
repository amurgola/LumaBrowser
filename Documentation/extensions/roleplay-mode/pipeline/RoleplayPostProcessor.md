# RoleplayPostProcessor

`extensions/roleplay-mode/pipeline/RoleplayPostProcessor.js`

The mode's server-side reaction after each assistant turn.

## Methods

- `new RoleplayPostProcessor(chat, logger)`;
  `process({ content, assistantMessageId, meta, emit, setMeta, replaceContent, aborted })`
  never throws; an aborted or empty turn does nothing. In order: the optional
  [polish](ProsePolishCall.md) (`options.prosePolish`; a rewrite replaces the
  stored reply through `replaceContent` so the stage call reads the same text),
  reconcile (migration, the story turn counter, speakers, audit, the stage call
  on every turn, [casting](ProfileCall.md) for present characters without a
  profile, [consolidation](ConsolidateCall.md) when due), save and announce,
  then draw: skip an unchanged moment, try the fast composite, else run the
  image phase. A cancel ends with `mode:image-fail { canceled: true }`.
