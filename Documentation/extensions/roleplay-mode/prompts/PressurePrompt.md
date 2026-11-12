# PressurePrompt

`extensions/roleplay-mode/prompts/PressurePrompt.js`

The STORY EDITOR call that gives the narrator the force that drives the story
when the player does not: strict JSON `{ pressure, thread }`. `pressure` is
one short present-tense sentence (at most 25 words) of something already in
the story that will come to the player if they do nothing: a character acting
on what they want, a deadline, a consequence of what the player did. It is
built only from the premise, the story so far and the characters listed, never
a new person, place, event or secret. It must still be true if the player
walks away from the scene: never what a character is doing, feeling or
waiting for in the passage ("she is waiting to see if he accepts" is the
scene, not a pressure), not a theme, not a mood. It is `""` when nothing
presses on the player yet, which the prompt calls the usual answer early on. `thread` is the premise's central question in one short
phrase, kept unless the story has clearly moved past it. Written from the
premise, tone, player, clock, story summary, the current central and other
open threads, the previous pressure, the present cast's wants and secrets, and
the latest passage (capped at 2500 characters).

## Methods

- `PressurePrompt.messages(data, content)` `[system, user]` (`/no_think`).
- `PressurePrompt.parse(text)` `{ pressure, thread }`, either or both `''`
  ("nothing presses yet" is an answer), or null when the reply has no JSON
  object.

## Why

Threads the stage call records are a log of hooks the narrator already wrote;
nothing in them says where the story is going. The pressure line and the
pinned central thread are the narrator's own agenda. Used by
[PressureCall](../pipeline/PressureCall.md), shown in
[NarratorContext](NarratorContext.md)'s trailing anchor.

The earlier prompt asked who or what was closing in and what stalling cost,
and was first run on the opening turn. The line it wrote there described that
first moment, and the narrator replayed it for the rest of the story.

`looksAhead(pressure)` is true only for a line that says something is going to
happen, on a condition or by a time ("will", "unless", "before", "comes for",
"returns", "at dusk"). "Mrs. Chen is waiting for Albert to move away" is the
scene, not a pressure.
