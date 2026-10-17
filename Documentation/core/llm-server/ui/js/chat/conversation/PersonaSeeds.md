# PersonaSeeds

`core/llm-server/ui/js/chat/conversation/PersonaSeeds.js`

Starters per guided setup choice (chat, create, build, tune), each
`[label, iconHtml, seedText, description]`. The landing shows them as start
cards through [LandingStarts](LandingStarts.md); a page-level
`window.LumaLandingSeeds` replaces them with plain seed buttons.

## Methods

- `PersonaSeeds.SEEDS`, `PersonaSeeds.forPersona(persona)`.
- `PersonaSeeds.resolve(personaSeeds)`: a non-empty `window.LumaLandingSeeds`
  wins.

## Globals

Reads `window.LumaLandingSeeds`.
