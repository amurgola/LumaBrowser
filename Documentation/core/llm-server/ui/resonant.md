# resonant.js (vendor)

`core/llm-server/ui/resonant.js`

ResonantJs, the owner's reactive templating framework, vendored byte for byte
from `amurgola/ResonantJs` `main` at commit `fbd1495` (1.3.1 plus three
unreleased commits, copied 2026-11-20). It is an allowed exception to the house
rules: not one class per file, not a module, and it keeps its em-dashes because
the owner's rule is "copy it unchanged". Nothing here differs from upstream. A
framework change is made in ResonantJs first, with its tests there, and arrives
here by copying the file again.

## What the app relies on

- **An edited array row is updated in place.** Setting a property on an array
  item keeps the item's row element and rewrites only the bound values that
  changed; sibling rows are neither re-rendered nor moved. A row is re-created
  only when its item is replaced by a different object.
  [ModelListController](js/models/ModelListController.md)`.patchRow` feeds
  download progress through this several times a second. Before the 2026-11-20
  copy the framework re-created the patched row and detached and re-appended
  every sibling on each change, so the row under the pointer lost its hover
  highlight on every tick (the model list pulsed) and focus inside the row was
  dropped.
- `stream(name, { patch })`, where `patch(el, html)` writes a flush instead of
  `el.innerHTML = html` (the chat's live answer passes
  [HtmlPatcher](js/dom/HtmlPatcher.md)`.apply`).
- Scalar writes render in the batched flush: read the DOM after the next tick,
  not synchronously after a write.
- An array's per-item template is cached on the template element, not on
  `window` as `<variable>_template`.

## How modules use it

Pages load it as a classic script before their module entry:
`<script src="/llm-ui/resonant.js"></script>` (the PWA and Dashboard use the
same URL; the pop-out live page, written by LiveModuleDocument, loads it the same
way). It defines `window.Resonant` and `window.ObservableArray`. Module code
never touches those globals directly; it goes through
[ResonantRuntime](js/resonant/ResonantRuntime.md). Importing the file as a
module was rejected: module code runs in strict mode, which would change the
framework's semantics, and loading it both ways on one page would evaluate it
twice.

## Globals

Writes `window.Resonant`, `window.ObservableArray`. With `bindToWindow` (the
default) an instance also mirrors each added variable onto `window`.
