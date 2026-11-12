# ProfilePrompt

`extensions/roleplay-mode/prompts/ProfilePrompt.js`

The CASTING DIRECTOR call that writes a new character's profile the first time
they are in scene: strict JSON `{ summary, appearance, history, voice, wants,
hides, tells: [..], bondUser, bonds: { <cast name>: .. } }` from the premise,
tone, player, the rest of the cast (name, summary, voice cue and want, up to
`CAST_MAX` 8, so the new character is written to be unlike them), what is
already known and the passage that introduced them (capped at 2500
characters). The card keeps the character consistent and is not a place to
add plot: `history` is one plain, ordinary sentence in keeping with the
premise and the passage (no tragedy, crimes or mysteries they do not state,
`""` when nothing is known); `wants` is what they want right now, taken from
how they act in the passage; `hides` is `""` unless the premise or the passage
clearly shows they conceal something; `bonds` has a line for another cast
member only when the passage shows how the two relate, so `{}` is the usual
answer.

## Methods

- `ProfilePrompt.messages(data, char, content)` `[system, user]` (`/no_think`);
  `castLines(data, char)` the other characters' lines.
- `ProfilePrompt.parse(text, knownNames)` the patch for
  [CharacterProfile](../world/CharacterProfile.md)`.apply`, or null; bond keys
  are matched case-insensitively to `knownNames` when given (unknown names and
  the player are dropped). A `hides` that says there is nothing ("nothing
  obvious", "none", "n/a", `NOTHING`) becomes `''`.
