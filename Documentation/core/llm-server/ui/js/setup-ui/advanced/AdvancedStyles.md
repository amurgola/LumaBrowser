# AdvancedStyles

`core/llm-server/ui/js/setup-ui/advanced/AdvancedStyles.js`

The placement canvas stylesheet, injected once into the page head the first time the Advanced view opens.

## Methods

- `inject(doc?)`: adds `<style id="adv-styles">` once; `CSS` holds the rules unchanged.

## Globals

Writes `<head>`.

## Preview height

`.adv-previewing { min-height:100vh; }` keeps the page from scrolling up when an example PC's shorter plan replaces
the real canvas.

## Room for the Setup / Chat switch (2026-11-14)

`.adv-head` has `padding-right:170px`, the same reserve `.page-head` has in `ui/css/setup.css`. The switch
(`.mode-slider` in `ui/css/chat.css`) is fixed at the top right, and once the page scrolls the head passes under
it; at window widths around 1250 px it covered the right end of Auto-arrange (ISSUES.md 29). The text column keeps
its 660 px cap, so the reserve only moves the button left.
