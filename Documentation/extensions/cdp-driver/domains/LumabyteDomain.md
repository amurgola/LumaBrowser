# LumabyteDomain

`extensions/cdp-driver/domains/LumabyteDomain.js`

The custom `Lumabyte.*` domain for LLM selector fallback; any CDP client reaches it
through its session (Puppeteer `CDPSession.send`, Playwright `newCDPSession`, CRI `send`).

## Methods

All but `getInfo` need a session (`-32600 Lumabyte.<m> requires a session`).

- `Lumabyte.find({ description?, selector?, retry? })` -> `{ selector, strategy }`.
  A matching `selector` wins (`'selector'`). With `retry: false` a miss returns
  `'selector-miss'` (or fails without a selector). Otherwise the session needs
  fallback available and enabled, and the description resolves through
  [LlmSelectorFallback](../LlmSelectorFallback.md) (`'description'`).
- `Lumabyte.click({ ..., button = 'left' })` resolves as above, scrolls the node into
  view, and presses and releases at the centre of its content box ([DomQuery](DomQuery.md))
  -> `{ clicked: true, selector, strategy, x, y }`.
- `Lumabyte.domSnapshot({ includeAxTree?, includeScreenshot? })` ->
  `{ snapshot, axTree?, screenshot? }` (base64 PNG). A screenshot brings the tab
  forward first and restores the user's tab after ([TabForeground](TabForeground.md)).
- `Lumabyte.configureFallback(params)` sets the session config with
  `FallbackConfig.normalize(params, defaults)` -> `{ config }` (an empty object enables it).
- `Lumabyte.getInfo()` -> `{ fallbackAvailable, config, defaults }`.
