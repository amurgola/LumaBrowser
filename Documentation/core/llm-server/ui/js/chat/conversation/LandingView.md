# LandingView

`core/llm-server/ui/js/chat/conversation/LandingView.js`

The landing screen: a greeting over the big centred composer and the starter
chips (a click fills the composer). Rendering it resets the chat to "no
conversation": plain mode, no panel, cleared session caches, no bottom composer,
and the Code surface reported unavailable.

## Methods

- `render()`.
- `isShowing()`.

The persona (`api.getPersona`) is asked once; its seeds show unless the page set
`window.LumaLandingSeeds`, which always wins.

## Globals

Reads `window.LumaLandingSeeds` (`[[label, iconHtml, seedText], ...]`).
