# NarratorContext

`extensions/roleplay-mode/prompts/NarratorContext.js`

Assembles the narrator's context for one turn in layers under per-layer token
caps: the brief, `## Premise` (with `## Tone` and `## The player`), `## Story so
far` (clock, summary, recent unsummarised events, the best-ranked open threads,
the `Pressing:` line), `## In the scene now` (a full card per present
character), `## Off stage` (one line each, capped), `## Setting`, then the raw
history trimmed to its share, and a trailing anchor (`[Scene notes for this
reply]`: each present character's state line and outfit, the top three open
threads, the `Pressure:` line, the length band, and the rule that the player's
choices stay theirs while everyone else acts on their own wants) that the
router folds after the newest message. Threads come from
[StoryLedger](../world/StoryLedger.md)`.openThreads`, pinned and most-touched
first, so the premise's hook is never pushed out by incidental ones.

## Methods

- `NarratorContext.build(data, { messages, contextWindow })` ->
  `{ systemPrompt, postHistoryPrompt, messages, window, dropped }`.
- `NarratorContext.cast(data)` -> `{ present, offstage }`: the tracked moment
  first; before any state exists every set-up character not marked absent
  starts on stage; off stage sorted by most recent activity, capped at 8.
- `NarratorContext.card(c)` one character's block (summary, past, looks,
  wearing, voice, tells, wants, hides, bonds, arc, recent beats, now);
  `offstageLine(d, c)`.

## Why

Only the cast in scene gets a full card (the group-chat "swap" rule), so cost
stays flat as the roster grows and absent characters do not crowd the present
ones. The anchor after the history is the post-history-instructions pattern:
current models weigh an instruction there more than one at the top.
