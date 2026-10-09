# PersonaSeeds

`core/llm-server/ui/js/chat/conversation/PersonaSeeds.js`

The landing's starter chips per first-run persona (chat, create, build, tune) and
the greeting by hour.

## Methods

- `PersonaSeeds.SEEDS`, `PersonaSeeds.forPersona(persona)`.
- `PersonaSeeds.resolve(personaSeeds)`: a non-empty `window.LumaLandingSeeds`
  wins.
- `PersonaSeeds.greeting(date?)`.

## Globals

Reads `window.LumaLandingSeeds`.
