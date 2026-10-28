# LabCompletionKind

`core/roleplay-lab/LabCompletionKind.js`

Guesses which roleplay agent an LLM side-call belongs to, from the lowercased
JSON of its messages, so the Lab can answer it with a canned mock.

## Methods

- `LabCompletionKind.detect(opts)` `'stage'`, `'profile'`, `'consolidate'`, `'extract'`, `'wardrobe'`,
  `'director'` or null. Rules, first match wins:
  1. `stage manager` -> stage (StagingPrompt, the merged pass)
  1. `casting director` -> profile (ProfilePrompt)
  1. `character records of an interactive roleplay` / `story record of an interactive roleplay` -> consolidate (ConsolidatePrompt)
  2. `world-state` -> extract; `wardrobe supervisor` -> wardrobe;
     `cinematographer` -> director (legacy per-agent prompts)
  3. `wardrobe` / `outfit` -> wardrobe; `shot` / `director` / `camera` -> director;
     `location` / `characters` -> extract (generic fallbacks for hand-written test messages)
- `LabCompletionKind.RULES` the ordered rules.

## Why the order

The stage schema itself contains "outfit" and "characters", and the extraction
schema contains "outfit", so every distinctive marker must be checked before
any generic keyword or the call is mis-routed.
