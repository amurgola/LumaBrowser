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
   card per present character, without this turn's state, which the scene
   notes carry), `## Up close this turn`, `## Off stage`
   (one line each, capped), `## Setting`. Then the trailing anchor (`[Scene notes for this reply]`: each present
   character's state line and outfit, the top three open threads as
   `Open questions (background, do not raise them yourself):`, the pressure as
   `Pressure (background, only if the player stalls):` clipped to
   `PRESSURE_TOKENS` (45), and the closing rules: the notes are private, answer
   what the player just did as stated, stop when they have something to
   respond to, this reply's word ceiling (`lengthRule`), only those the
   moment involves act or speak, nothing new unless the action calls for it,
   and the player is "you" in every sentence of narration).

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
- `NarratorContext.card(c, { marks, turn, state })` one character's block, see
  Cards below; `offstageLine(d, c)`.
- `NarratorContext.playerMove(messages)` the trimmed text of the newest user
  message, `''` when there is none.
- `NarratorContext.lengthRule(d, mode, move)` the sentence that states this
  reply's word ceiling, see Reply length below.

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

The rule also says that only those the moment involves act or speak. With a
five-person cast kept on stage at an 8k window, the facts used to push the
rule out of the cap. Replies then ran long (an average of 276 words, 25%
inside what was then a 120 to 250-word band).

## Cards (2026-11-12)

`card(c, { marks = true, turn = 0, state = true })` lists the lines that keep a character
recognisable first and the background last, so a clip at the layer's cap
costs the background and not the voice: the name and summary, `looks`,
`noticed since`, `wearing`, `voice`, `now`, `toward the player`, `wants`,
`habits`, `with others`, `so far`, `earlier`, then
`background (off the page until the story reaches it):` and
`keeps private (no hints):`.

- `earlier` (it was `lately`) lists only the beats older than the last
  `HISTORY_TURNS` (2) turns when `turn` is given. The raw history still holds
  the newer replies word for word, and a beat from one of them was echoed
  back.
- A walk-on ([CastRole](../world/CastRole.md)) gets one line: the name and
  summary with `(in the background)`, then `looks:` and `wearing:` when known.
- The cards close with a line saying they are for consistency, not material.
- `state` (default true) keeps the full card. With `state: false` the card
  leaves out what the scene notes say for this turn: `wearing:` (on a
  walk-on's line too), the `now:` line, and `toward the player:` when the
  state holds a `bondUser`. An attitude that exists only in the profile's
  bonds is not in the scene notes, so it stays on the card. `_present` builds
  the `## In the scene now` cards with `state: false`. Printed in both places,
  the state was the largest repeat in the request, and the narrator echoed
  it.

## Reply length

The scene notes' closing rules state a word ceiling for this reply, sized to
the player's last message (`playerMove`). "Up to 180 words, fewer for a small
move" was read as 180: a one-line action got 135 to 190 words every time.
`lengthRule(d, mode, move)` counts the words of the move and returns:

- up to `SMALL_MOVE_WORDS` (14): "the player made a small move, so answer in
  two to four sentences, at most N words." with N = `SMALL_SHARE` (0.4) of
  the mode's `max`, rounded to the nearest 5 (snappy 35, balanced 70, lush
  130).
- up to `MEDIUM_MOVE_WORDS` (40): "at most N words." with N = `MEDIUM_SHARE`
  (0.7) of the max, rounded the same way (snappy 65, balanced 125, lush 225).
- a longer message, no player text, or the opening turn (`story.turn` 0):
  "at most <max> words."

The rules end with a sentence that the player is "you" in every sentence of
narration, never their name or "he", "she" or "they". The brief says the same
once at the top ([NarratorBrief](NarratorBrief.md)); the rule after the
history is the one a long story still obeys.

The scene notes call the threads and the pressure background, and the closing
rules open with `These notes are private`. They were `Open:` and `Pressure:`
lines before; a reply that still announces the notes by name ("Pressure
builds:") has the label removed by [ProseCleanup](ProseCleanup.md).

## Word ceiling (2026-11-12)

`wordCap(d, mode, move)` is the number `lengthRule` states; `build()` returns
it as `wordCap`, the mode descriptor puts it on the turn and remembers it in
`ReplyLength`, and the reaction holds an overlong reply to it.

The scene notes' closing rules end with "Spoken words always sit inside double
quotes."

An off-stage line now leads with the whereabouts, then the attitude to the
player, then the summary, so a clip at a small window costs the summary.

## Recall and shorter closing rules (2026-11-12)

"Story so far" gains "From earlier, relevant now:" with the ledger rows
`LedgerRecall` picked for the player's line. The scene notes close on four
short rules (private notes, answer the player's action then stop within the
stated length, add nothing new, the player is "you"); the rest lives in the
brief.

With narrator thinking on Brief, the scene notes end with one more line telling
a reasoning model to decide in a few lines and not draft or audit the reply.
