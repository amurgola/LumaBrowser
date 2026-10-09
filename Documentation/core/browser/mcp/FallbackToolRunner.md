# FallbackToolRunner

`core/browser/mcp/FallbackToolRunner.js`

Runs a selector-based browser MCP tool through [SelectorFallback](../controller/SelectorFallback.md) and
shapes the MCP reply.

## Methods

- `new FallbackToolRunner(browserService, llmFallbackService)`.
- `run({ tabId, args, action, method, buildOpts(args), buildRetryOpts?(args), fallbackKey = 'selector',
  fallbackNeedsSelector?, visualFallback? })`: calls `browserService[method](tabId, buildOpts(args))`;
  a retry with a resolved selector uses `buildRetryOpts` (default `buildOpts`) on `{ ...args, selector }`.
  `fallbackKey: null` disables the fallback (the tool has no top-level selector). Success replies
  `{ success: true, data }` with `resolvedSelector` when resolved and navigation stamped
  ([NavigationStamp](../controller/NavigationStamp.md)).
- On failure, when `visualFallback` and the description was tried, a vision click
  (`browserService.locate(tabId, { description, click: true })`, only if `hasVisualGrounding()`) answers
  with `resolvedBy: 'vision'` (or `'cache'`). Else the error: `LLM could not resolve a selector` after a
  direct attempt, otherwise the primary error or `Failed to <action>`.
