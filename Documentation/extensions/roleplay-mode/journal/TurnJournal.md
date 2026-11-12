# TurnJournal

`extensions/roleplay-mode/journal/TurnJournal.js`

The verbose turn log of a roleplay conversation, switched on per story by the
setup option "Verbose turn log" (`options.verboseLog`, also a toggle in the
gear). Off by default: a story without the option is not recorded, observed or
written. Nothing here can fail a turn; every entry point swallows its errors.

## What a recorded turn holds, in order

1. `setup` (once per conversation): the premise, the player, tone, length,
   models, options and the characters and scenes the story started with.
2. `turn_prepare`: the kind of turn (`new message`, `regeneration (reply n to
   this message)`, `edited message (wording n of this turn)`), the player's
   text, the shown branch, the messages the turn continues from, which timeline
   point the story state was taken from, how many bookkeeping runs were stopped
   for it, how long it waited for earlier bookkeeping, and a digest of the
   state handed to the narrator.
3. `tree_change` (only when something moved): what the message tree and the
   story state did since the turn before, from two `TreeDigest`s. A
   regeneration or an edit shows the head moving back and the ledger rows,
   threads and cast the replaced reply had added leaving the state; a deleted
   message shows as removed with the timeline point it took. A deletion is
   seen when the next turn is prepared.
4. `narrator_request`: the request exactly as the app's dispatcher sent it
   (`router.observeDispatch`, after every override), with `ContextAudit`'s
   table of tokens per part, the six-word phrases that repeat between parts,
   the share of the window used, and `historyDiff` against the previous
   request (kept, new, dropped from the front, rewritten, or diverging at a
   message when the branch changed).
5. `reply`: the reply as it came back, the stored version when tidying changed
   it, reasoning, the server's token counts, any tool calls on the row.
6. `side_call` (one per bookkeeping call, from `ScopedChat`): the kind (stage,
   casting, pressure, consolidation, polish), the request, the answer, the
   time it took, and its error when it failed or was stopped.
7. `state_changes`: the reply's changes as the page lists them and the state
   digest after the save.
8. `reaction_end`: `finished`, `stopped`, `failed` or `skipped`.

## Methods

- `TurnJournal.shared` the instance the reaction pipeline writes to.
- `TurnJournal.enabled(data)`, `active(conversationId)`, `paths(conversationId)`.
- `prepare`, `onRequest`, `reply`, `side`, `changes`, `end`: one per event above.
- `TurnJournal.kindOf(tree, path)` reads the kind of turn from the tree as it
  stands when the turn is prepared (the player's message stored, the reply not).
- `TurnJournal.historyDiff(prev, cur)` and `TurnJournal.promptBlock(role,
  previous, current)`: a prompt is printed in full the first time, named when
  identical to the last one printed, and as removed and added lines when it
  changed.

The readable log is `JournalMarkdown`'s; the files are `JournalFiles`'s.

## Lookups and call tally (2026-11-12)

`grounding({ conversationId, body, surface })` records the turn's two
knowledge-base lookups between the turn header and the narrator request.
`reaction_end` carries `calls` (each bookkeeping call made for the reply, with
whether it was answered) and `missing` (`['stage']` when a finished run had no
answered stage call, which means nothing was recorded for that reply).
