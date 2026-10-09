# LabCompletionKind

`core/roleplay-lab/LabCompletionKind.js`

Guesses which roleplay agent an LLM side-call belongs to, from the lowercased
JSON of its messages, so the Lab can answer it with a canned mock.

## Methods

- `LabCompletionKind.detect(opts)` `'stage'`, `'extract'`, `'wardrobe'`,
  `'director'` or null. Rules, first match wins:
  1. `stage manager` -> stage (agents.js buildStagingMessages, the merged pass)
  2. `world-state` -> extract; `wardrobe supervisor` -> wardrobe;
     `cinematographer` -> director (legacy per-agent prompts)
  3. `wardrobe` / `outfit` -> wardrobe; `shot` / `director` / `camera` -> director;
     `location` / `characters` -> extract (generic fallbacks for hand-written test messages)
- `LabCompletionKind.RULES` the ordered rules.

## Why the order

The stage schema itself contains "outfit" and "characters", and the extraction
schema contains "outfit", so every distinctive marker must be checked before
any generic keyword or the call is mis-routed.
