# DesktopClickLadder

`core/desktop/service/DesktopClickLadder.js`

`desktop_click` after the window is resolved.

## Methods

- `new DesktopClickLadder(parts)` with DesktopService's shared parts.
- `click(w, args)` never throws. First `guards.targetRefusal(w)`: it covers the UIA
  pattern path too (UIPI blocks it for elevated targets, and it is still automation
  inside a protected game). Then, by what `args` carries:
  - `ref`: needs an observation of this window. A plain left click asks UIA to
    invoke it (`{ method: 'uia:<pattern>' }`, no focus, no cursor); when the element
    needs a pointer UIA answers with its (scrolled-into-view) rect. Right, middle
    and double clicks locate the observed ref ([RefLocator](RefLocator.md)). The
    pointer click at the centre is refused when covered.
    `{ method: 'pointer', ref, scrolled?, hit? }`.
  - `x`/`y`: pixels of the last screenshot of this window ([ScreenFrames](ScreenFrames.md)).
    `{ method: 'pointer', screen, hit? }`.
  - `description`: visual grounding (`locateInImage`, `skipVisionCheck: false`)
    on the full-size window capture, then a pointer click.
    `{ method: 'vision+pointer', screen, profile, ms, hit? }`.
  - none: `Pass ref (from desktop_observe), x/y (from desktop_screenshot), or description.`
- `button` `left|right|middle`; `double: true` or `clickCount: 2` double-clicks.
