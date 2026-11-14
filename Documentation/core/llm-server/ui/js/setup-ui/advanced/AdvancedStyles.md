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
