# LandingView

`core/llm-server/ui/js/chat/conversation/LandingView.js`

The landing screen, in the guided setup's language (left-aligned question,
cards like `.setup-wizard__card`): "Where do you want to start?", one status
line saying where the model runs (`[data-cm-landing-context]`, filled by
[ModelPicker](../composer/ModelPicker.md) `renderPill()`; the no-model notice
replaces it), the composer, then up to six start cards from
[LandingStarts](LandingStarts.md) in `[data-cm-starts]`. The cards fill in once
the open tabs (`ctx.tabs.list()`) and the guided setup choice
(`api.getPersona()`, asked once) arrive, and only if the landing is still
showing. A click on a page card attaches the page (`ctx.tabs.attach`) and marks the card
"Attached to your message" (or "This page could not be read"), on the
conversation card opens it (`ctx.conversation.open`), on a starter fills the
composer. Rendering it resets the chat to "no conversation": plain mode, no
panel, cleared session caches, no bottom composer, and the Code surface
reported unavailable.

## Methods

- `render()`.
- `isShowing()`.

## Globals

Reads `window.LumaLandingSeeds` (`[[label, iconHtml, seedText], ...]`): when a
page sets it (the lumabyte.com web demo), a row of seed buttons sits under the
composer instead of the start cards, and a click fills it.
