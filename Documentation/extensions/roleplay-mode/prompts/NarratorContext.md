# NarratorContext

`extensions/roleplay-mode/prompts/NarratorContext.js`

Assembles the narrator's context for one turn in layers under per-layer token
caps, in three places:

1. The system prompt, which stays the same from turn to turn: the brief,
   `## Premise` (with `## Tone` and `## The player`) and the body notes of the
   cast on stage.
2. The raw history, trimmed to its share.
3. The newest message, after the player's own text. First the story state,
   opened by `STATE_OPEN`: `## Story so far` (clock, summary, recent
   unsummarised events, the remaining open threads), `## In the scene now` (a
   full card per present character), `## Up close this turn`, `## Off stage`
   (one line each, capped), `## Setting`. Then the trailing anchor (`[Scene notes for this reply]`: each present
   character's state line and outfit, the top three open threads, the
   `Pressure:` line, the length band, and the rule that the player's choices
   stay theirs while everyone else acts on their own wants).

The router places the two parts of the newest message
([ModeTurnMessages](../../../core/llm-server/chat/router/ModeTurnMessages.md):
`turnPrompt` and `postHistoryPrompt`). Threads come from
[StoryLedger](../world/StoryLedger.md)`.openThreads`, pinned and most-touched
first, so the premise's hook is never pushed out by incidental ones.

## Methods

- `NarratorContext.build(data, { messages, contextWindow, grounding, surface, stateInHead })` ->
  `{ systemPrompt, turnPrompt, postHistoryPrompt, contextText, messages,
  window, dropped, cleaned }`. `systemPrompt` is the stable head, `turnPrompt`
  the framed story state (`''` when there is none), `contextText` the head and
  the story state as one text (no frame lines) for callers that only ask what
  the narrator is told. The history budget is what the window leaves after
  the head, the story state and the anchor.
  With `stateInHead` (a core that does not place a turn prompt) the story
  state closes `systemPrompt` instead and `turnPrompt` is `''`.
- `STATE_OPEN`: the line that opens the story state, so the model reads it
  as the narrator's notes and not as something the player said; the scene
  notes' own header closes it.
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

## The prompt cache

llama-server keeps what it has already read only up to the first changed
character of a request. With the story so far and the cast cards in the system
prompt, the head changed every turn and the whole history was read again: a
32 turn run at an 8k window re-read 138,641 of 140,265 narrator prompt tokens
(2026-11-11), and the cost grows with the window, since the history may fill
half of it. With those layers in the newest message the request is the last
one plus a new tail, and only the tail is read.

The body notes layer ([BodyNotes](BodyNotes.md)) stays in the head, right
after the premise: it is the largest layer (1.1k to 1.6k tokens) and the same
until the cast changes, so a change of cast re-reads the history once. The
up-close layer changes every turn and rides with the cast cards.

The player's text comes first in the newest message. With the story state
ahead of it, replays of the same recorded turns (Qwen3.8-27B, effort low,
2026-11-11) had the model reason 4,400 characters on average against 1,900
on the old layout, and one in twelve never left its reasoning, which the chat
shows as an empty reply (three of three judged ten-turn runs ended that way).
With the state after the player's text: 2,450 characters and none empty.

[HistoryTrimmer](HistoryTrimmer.md) moves its cut in steps for the same
reason: a cut that moved every turn changed the first history message every
turn.

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
