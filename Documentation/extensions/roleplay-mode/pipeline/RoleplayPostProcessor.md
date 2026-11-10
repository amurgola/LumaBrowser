# RoleplayPostProcessor

`extensions/roleplay-mode/pipeline/RoleplayPostProcessor.js`

The mode's server-side reaction after each assistant turn.

## Methods

- `new RoleplayPostProcessor(chat, logger, { paths, reactions })`: `chat` is
  wrapped by [ScopedChat](ScopedChat.md); `paths` a
  [ConversationPath](../world/ConversationPath.md) (the app's chat store by
  default), `reactions` a [ReactionRegistry](ReactionRegistry.md).
- `process({ content, conversationId, assistantMessageId, meta, emit, setMeta,
  replaceContent, aborted })` never throws; an aborted or empty turn does
  nothing. It runs inside a [ReactionScope](ReactionScope.md), waits (bounded)
  for earlier reactions' world phase in the conversation, and starts from the
  freshly stored data with the head moved to the point of the replies this one
  follows ([timeline](../timeline.md)), so a regenerate never builds on its
  sibling. The world phase reports as the reply's activity
  (`mode:activity`). In order: the optional
  [polish](ProsePolishCall.md) (`options.prosePolish`; a rewrite replaces the
  stored reply through `replaceContent` so the stage call reads the same text),
  reconcile (migration, the story turn counter, speakers, audit, the stage call
  on every turn, [casting](ProfileCall.md) for present characters without a
  profile, [consolidation](ConsolidateCall.md) when due, the
  [pressure line](PressureCall.md) on the first turn and after each summary),
  commit the reply's point with its changes, save and announce,
  then draw: skip an unchanged moment, try the fast composite, else run the
  image phase. A cancel ends with `mode:image-fail { canceled: true }`; a stop
  (the reply replaced or removed) ends the same way, writes nothing, and marks
  the activity stopped.
- `prepareTurn({ conversationId, meta })`: before a turn is written, stops the
  reactions of replies the turn does not continue from, waits (bounded) for the
  world phase of the ones it does, and returns meta with the head at the end of
  that path. Without a chat store, the given meta.

## Changes (2026-11-09)

The reply is run through `HistoryTrimmer.stripDebris` first: a conversation
opened before the mode declined reply choices may still end its replies on
the chat's ```choices fence, and the stage and the records read prose only.
