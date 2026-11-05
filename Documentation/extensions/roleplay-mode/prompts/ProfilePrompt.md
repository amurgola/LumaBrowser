# ProfilePrompt

`extensions/roleplay-mode/prompts/ProfilePrompt.js`

The CASTING DIRECTOR call that writes a new character's profile the first time
they are in scene: strict JSON `{ summary, appearance, history, voice, wants,
hides, tells: [..], bondUser, bonds: { <cast name>: .. } }` from the premise,
tone, player, the rest of the cast (name, summary, voice cue and want, up to
`CAST_MAX` 8, so the new character is written to be unlike them), what is
already known and the passage that introduced them (capped at 2500
characters). `history` is two or three sentences of their past before the
story; `wants` is asked to be something that can clash with the player; `bonds`
is one line per other cast member they already know.

## Methods

- `ProfilePrompt.messages(data, char, content)` `[system, user]` (`/no_think`);
  `castLines(data, char)` the other characters' lines.
- `ProfilePrompt.parse(text, knownNames)` the patch for
  [CharacterProfile](../world/CharacterProfile.md)`.apply`, or null; bond keys
  are matched case-insensitively to `knownNames` when given (unknown names and
  the player are dropped).
