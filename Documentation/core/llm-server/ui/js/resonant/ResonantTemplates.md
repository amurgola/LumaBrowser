# ResonantTemplates

`core/llm-server/ui/js/resonant/ResonantTemplates.js`

The small, deliberate set of ResonantJs templates shared across LLM-tab
sections.

## Methods

- `ResonantTemplates.registerAll(resonant)` registers every template in
  `TEMPLATES` with `resonant.registerTemplate(name, html)`. Returns `false` and
  does nothing when the instance has no `registerTemplate`. Page entries call
  `ResonantTemplates.registerAll(ResonantRuntime.shared())` once.
- `ResonantTemplates.ML_ROW` is the `mlRow` model row; `TEMPLATES` maps names to
  markup.

## The mlRow contract

The row view object each model-list adapter builds: `mlKey` (identity, not
Resonant's own `.key`), `expanded` (reactive collapse on the caret and details),
`caretEmpty`, `name`, `sizeText` (text), and the HTML blocks `renameHtml`,
`tagsHtml`, `metaHtml`, `ctxFitHtml`, `fitHtml`, `quantHtml`, `dlHtml`,
`blurbHtml`, `shardsHtml`, `actionsHtml` (bound with `res-html`, so the adapter
must escape what it interpolates; an empty block collapses through CSS). The
head click calls the injected handler `res.mltoggle`. `res-style` sits on the
caret and details, not the root: Resonant's `querySelectorAll` never matches a
template root, and the root must stay a plain `.model-row` for its CSS.

## When a template belongs here

All three must hold: it is data-driven (rendered from data, usually many
times), it has two or more consumers (extract on the second use), and it is
structurally stable (deeply conditional markup reads better as a function).
Look consistency comes from CSS (`luma-badge`, `luma-btn`, ...), not templates.
Section-specific rows register in their own module. Prefer the framework
primitives: `res-empty` for empty states, injected `(item, event)` handlers via
`res-onclick="res.name"` plus `res-on:name` at the mount, and `res-format`
transforms for derived cells.

## Globals

None (registration goes to the instance passed in).
