# PressurePrompt

`extensions/roleplay-mode/prompts/PressurePrompt.js`

The STORY EDITOR call that gives the narrator a line of its own to push:
strict JSON `{ pressure, thread }`. `pressure` is one present-tense sentence
naming who or what is moving toward the player right now, how soon, and what
stalling costs (an antagonist closing in, a deadline, a secret about to
surface, a debt coming due). `thread` is the premise's central question in one
short phrase, the hook the story keeps returning to (kept unless the story has
clearly moved past it). Written from the premise, tone, player, clock, story
summary, the current central and other open threads, the previous pressure,
the present cast's wants and secrets, and the latest passage (capped at 2500
characters).

## Methods

- `PressurePrompt.messages(data, content)` `[system, user]` (`/no_think`).
- `PressurePrompt.parse(text)` `{ pressure, thread }` (either may be empty), or
  null when the reply carries neither.

## Why

Threads the stage call records are a log of hooks the narrator already wrote;
nothing in them says where the story is going. The pressure line and the
pinned central thread are the narrator's own agenda, re-read after every
summary so it moves with the story. Used by [PressureCall](../pipeline/PressureCall.md),
shown in [NarratorContext](NarratorContext.md)'s story layer and trailing anchor.
