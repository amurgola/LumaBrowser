# SelectorFallback

`core/browser/controller/SelectorFallback.js`

The plain-language selector fallback the REST ([BrowserController](../BrowserController.md)) and MCP
([FallbackToolRunner](../mcp/FallbackToolRunner.md)) surfaces share, built on
[LlmFallbackOrchestrator](../LlmFallbackOrchestrator.md).

## Methods

- `SelectorFallback.run(spec)` with `spec = { service, tabId, action, selector, description,
  needsSelector?, primaryFirst?, primary(), retry(selector) }`. Resolves to
  `{ ok, via, result, resolvedSelector, attempted }`:
  - no selector, a description, and neither flag: the description resolves directly (`via: 'direct'`),
    `primary` never runs;
  - else `primary()`; success is `via: 'primary'`;
  - a failure is rescued (`via: 'recovered'`) when there is a description and either a selector or
    no `needsSelector`;
  - on failure `result` is the primary result, or `null` when only the description was tried, and
    `attempted` says whether the fallback ran.
- `needsSelector`: the description may only rescue a failed selector, never replace one (directional
  scroll, ref-targeted click, key press without a target).
- `primaryFirst`: always run `primary` first (a form fill, whose selectors live per field).
- `VIA_PRIMARY`, `VIA_DIRECT`, `VIA_RECOVERED`: the `via` values.
