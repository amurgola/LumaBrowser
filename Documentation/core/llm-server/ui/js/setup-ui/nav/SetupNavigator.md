# SetupNavigator

`core/llm-server/ui/js/setup-ui/nav/SetupNavigator.js`

Switches the Setup surface's sub-views (LLM, Image, Music, Advanced and extension tabs): the active nav button, the page header, which panes and card groups show, and each view's lazy init. Deep links land in `go()`.

## Methods

- `new SetupNavigator({ doc?, openers?, extensionTabs? })`: `openers` maps a view (`image`, `music`, `advanced`) to its lazy init; `extensionTabs.show(id)` runs for `ext:<id>`.
- `start()`: delegated `#pageNav` click handling, and the header follows the initially active button.
- `go(view)`: a bare id that is not a built-in view becomes `ext:<id>`; returns false and parks the view when its button is missing. `flushPending()` replays it; `current()` is the active view.
- `switchTo(name)`, `updateHeader(name)`. The `.grid` holds the LLM, Image and Music cards; its `data-view-pane` follows the view so CSS hides other card groups. Extension views title themselves with their nav label under the "Extension" eyebrow.

## Globals

Reads `document` (`#pageNav`, `#pageEyebrow`, `#pageTitle`, `.grid`, `[data-view-pane]`).
