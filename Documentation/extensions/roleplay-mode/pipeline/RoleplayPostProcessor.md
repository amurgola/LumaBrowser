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
  [pressure line](PressureCall.md) when due: not on the opening turn, then
  when there is none, after each summary and every few turns),
  commit the reply's point with its changes, save and announce,
  then draw: skip an unchanged moment, try the fast composite, else run the
  image phase. A cancel ends with `mode:image-fail { canceled: true }`; a stop
  (the reply replaced or removed) ends the same way, writes nothing, and marks
  the activity stopped.
- `prepareTurn({ conversationId, meta, signal })`: before a turn is written,
  stops the reactions of replies the turn does not continue from, waits
  (bounded) for the world phase of the ones it does, and returns meta with the
  head at the end of that path. Without a chat store, the given meta. `signal`
  (the turn's own abort signal, optional) ends the wait at once when the user
  presses Stop.

## Changes (2026-11-09)

The reply is run through `HistoryTrimmer.stripDebris` first: a conversation
opened before the mode declined reply choices may still end its replies on
the chat's ```choices fence, and the stage and the records read prose only.

## Changes (2026-11-12)

- Before anything else `_tidy` replaces the stored reply with its
  [ProseCleanup](../prompts/ProseCleanup.md) version through `replaceContent`
  (headings, a bold title, rules and note labels off), so the page shows prose
  and the next turn's history does not teach the model to open with a title.
  Not for an aborted reply; a store that refuses or throws keeps the reply as
  it was. The reaction reads the reply through `stripDebris`, which drops a
  heading the same way.
- A stop that lands during the stage call (or any bookkeeping call) ends the
  reaction there: the calls rethrow it, so no casting call follows and
  nothing is saved.
- Pending outfit renders are ignored unless
  [AssetSweepPlanner](AssetSweepPlanner.md)`.drawsFigures(data)`.
- Casting candidates are the characters in the scene only
  (`ProfileCall.candidates(data, present)`).

## Verbose turn log (2026-11-12)

With `options.verboseLog` on, `prepareTurn` reports the turn to `TurnJournal`
(the kind of turn, the tree, the state handed to the narrator, the wait), and
the reaction reports the reply, the state changes once saved and how it ended.
The story then carries `data.turnLog = { md, jsonl }` (a server-owned key the
timeline's save merge keeps) so the gear can show where the log is.

## Speakers and renamed walk-ons

`_addSpeakers` asks [CastResolver](../world/CastResolver.md)`.byName` whether
a bold-name speaker is known, so a label a character was known under before
they were named (`char.aliases`) counts: a later `**Woman:**` tag for Clare
adds no second row. A speaker row added for a name the stage call then says
was a walk-on is removed again by [CastRename](../world/CastRename.md).

## Overlong replies (2026-11-12)

`_tidy(content, replaceContent, cap)` also runs `ReplyLength.trim` with the
ceiling the turn stated, stores the result and returns the content the rest of
the reaction reads (the stored one when the store took it).
