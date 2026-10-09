# OnboardingPersona

`core/shell/settings/OnboardingPersona.js`

The persona chosen on the first wizard screen. It drives which onboarding path
runs and, later, the chat landing chips.

## Methods

- `OnboardingPersona.PERSONAS` `chat`, `create`, `build`, `tune`, `switch`;
  `DEFAULT` `chat`; `KEY` `core.persona`.
- `isKnown(p)`, `normalize(p)` (unknown becomes `chat`).
- `get(db)` the stored persona, normalized.
- `set(db, p)` stores the normalized persona; `{ success: true, persona }`.

## Why

`switch` is the "I already run local AI" path (LM Studio, Ollama, ComfyUI
users): existing-library scan first, landing on the Setup tab. The default is
the Home Chatter, so a user who never answers gets that path.
