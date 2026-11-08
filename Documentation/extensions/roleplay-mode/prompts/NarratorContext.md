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

- `NarratorContext.build(data, { messages, contextWindow, grounding, surface })` ->
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

## Grounding layers and the prompt cache

The body notes layer ([BodyNotes](BodyNotes.md)) comes right after the
premise, ahead of the story so far and the cast cards. Those change every turn,
and llama-server reuses only the unchanged start of a prompt, so the body notes
(the largest layer at 1.1k to 1.6k tokens, and the same until the cast changes)
are cached instead of re-read each turn. The up-close layer changes every turn
and sits after the cast cards.

A character with an up-close block this turn gets their marks there as
`established:` and not on the card as well (`card(c, { marks: false })`). The
return value also carries `cleaned`, the number of earlier replies stripped of
inline reasoning ([HistoryTrimmer](HistoryTrimmer.md)).

The story-so-far layer no longer repeats the pressure line or the top
`ANCHOR_THREADS` (3) open threads: the scene notes after the history carry
them every turn, where they weigh most. It lists only the remaining threads,
as `Other open threads:`. The repeat cost 45 to 65 tokens a turn (the jungle
run's context audit).

## Scene notes cap

The trailing scene notes get `ANCHOR_PER_CHARACTER` (40) tokens per character
on stage on top of the `anchor` layer cap (and the body labels' own room). The
closing rule is never what a clip cuts: the facts above it are clipped to what
the cap leaves after the rule.

The rule now also says that not everyone present needs a line, only those the
moment involves. With a five-person cast kept on stage at an 8k window, the
facts used to push the rule out of the cap. Replies then ran long (an average
of 276 words, 25% inside the 120 to 250-word band) and lost the handoff.
