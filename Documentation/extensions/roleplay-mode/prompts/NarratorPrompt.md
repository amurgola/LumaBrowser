# NarratorPrompt

`extensions/roleplay-mode/prompts/NarratorPrompt.js`

The narrator system prompt, rebuilt every turn from persisted meta.data so a
reopened roleplay fully restores the model's behaviour: a lean brief plus facts
the prose must not contradict.

## Methods

- `NarratorPrompt.build(data)` brief (with an "open the story" line for an empty
  world), `## Scenario`, `## Style`, `## Characters` (persona, appearance,
  current outfit), `## Current setting`, `## Current situation` (present cast,
  mood, outfit), joined with newlines.
