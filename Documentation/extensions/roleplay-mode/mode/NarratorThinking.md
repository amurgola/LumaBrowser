# NarratorThinking

`extensions/roleplay-mode/mode/NarratorThinking.js`

How much a reasoning model may think before the narrator's reply: the story
option "Narrator thinking" (`options.narratorThinking`), set in the setup
options or the gear.

| Mode | What the turn sends | Measured on Qwen3.8-27B |
| --- | --- | --- |
| `brief` (default) | `reasoning_budget_tokens: 512` with the samplers, and one line in the scene notes: decide, do not draft or audit | about ten seconds to the first word |
| `off` | `reasoningEffort: 'off'` on the turn (the router's thinking dial) | about one second; one recall check in eleven lost |
| `full` | nothing | 99 to 2,302 words of thinking, up to forty seconds |

Unbounded, a narrator turn drafted the whole reply in its thinking and checked
the draft against every rule of the brief; one turn spent its whole token cap
thinking and answered nothing. A model that does not reason ignores all three
modes.

- `of(data)`, `samplerFields(data)`, `directive(data)`, `effort(data)`.
