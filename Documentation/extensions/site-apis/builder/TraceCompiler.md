# TraceCompiler

`extensions/site-apis/builder/TraceCompiler.js`

Pure compiler from the browser tool calls of a demonstration to an endpoint step script.

## Methods

- `compile(calls, { params, examples, startUrl })`: `calls` is `[{ tool, params, success?, status?, result? }]`
  in order. Answers `{ steps, warnings, dropped: [{ tool, reason }], used }`.
- `validate(definition)`: `{ ok }` or `{ ok: false, error }` from `EndpointSpec.normalize`.
- `exampleValues(params, examples)`: `{ name: value }` from each param's `example` (else `default`), overlaid
  by `examples`.
- `placeholders(steps, values)`: replaces each value (longest first, `MIN_PLACEHOLDER_CHARS` = 3) in every
  string field of every step with `{{name}}`; a navigate url also matches the URL-encoded form (`%20` and `+`).
  Fields in `LITERAL_FIELDS` (kind, as, state, direction, transform fields) are never touched.
- `fieldName(text)`: a snake_case result field from a description ("the total price" to `total_price`), else
  `value`.

## Mapping

| call | step |
| --- | --- |
| navigate | `navigate { url }` then `settle` |
| click | `click { text? }` (+ `settle` when the result says `urlChanged`) |
| locate with click | `click { description }` then `settle`; without click dropped |
| type | `type { text, submit?, clear? }` (+ `settle` when submit) |
| fill_form | one `type` per field |
| press_key | `press_key { key }` |
| select_option | `select { option }` |
| set_date | `type { text: date, clear: true }` |
| scroll | `scroll { direction?, amount?, selector? }` |
| wait_for | `wait { selector?, description?, text?, state?, timeoutMs? }` |
| get_element | `read { as: fieldName(llmFallback) }` |
| extract_data | `extract { selector: baseSelector, childSelectors }` |
| collect_list | `extract { selector: itemSelector, childSelectors, maxRows }` |
| get_table | `table { selector, rowSelector?, cellSelector? }` |
| observe_page, get_source, screenshot, get_tabs, builder tools | ignored silently |
| click_at, set_slider, failed calls, unknown tools | dropped with a reason |

Targeted steps take `selector` from `params.selector` (else the result's resolved selector when present) and
`description` from `params.llmFallback` (else the result's element text, else the click's text filter). A
targeted call with neither keeps its place with an `UNKNOWN ELEMENT (observe_page ref N)` description and a
warning rather than vanishing. An extract without child selectors gets `{ text: ':scope' }` and a warning. With
`startUrl`, a script not starting with a navigate gets `navigate startUrl` plus `settle` prepended.

## Decisions

- The persisted trace holds only params (results are not stored, see [RecordedCalls](RecordedCalls.md)), so
  the result-based paths (`urlChanged`, resolved selector) only apply when a live trace is ever wired in.
