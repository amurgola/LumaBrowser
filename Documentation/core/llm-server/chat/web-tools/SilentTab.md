# SilentTab

`core/llm-server/chat/web-tools/SilentTab.js`

Renders a page in a background LumaBrowser tab that never takes focus and
returns its content once settled. Shared by the web lookup and
[LiveApi](../LiveApi.md).

## Methods

- `SilentTab.make(browserService, { partition?, isAborted? })` returns the
  `tabRender(url, opts)` function callers pass around.
- `render(url, opts)` resolves the content or `null` on any failure; the tab is
  always closed. `opts`: `html: true` (raw page, source type `full`) or `mode`
  (`markdown` default, `text`, `clean`, `full`); `needle` (text that means
  loaded); `timeoutMs` (settle budget, default 12 s, at least 3 s).
- `browserService` needs `createTab(url, { silent: true, kind: 'user',
  partition })` -> `{ tab: { id | tabId } }`, `getSource(tabId, { type })` ->
  `{ success, source }` and `closeTab(tabId)`.
- Statics: `PARTITION` (`persist:websearch`), `DEFAULT_SETTLE_MS`,
  `MIN_SETTLE_MS`, `POLL_INTERVAL_MS` (400), `STABLE_MIN_CHARS` (500).

## Settling

`createTab` does not wait for load, so the source is polled. Done when the
needle appears or, without one, when more than 500 characters hold still
across two polls (a cookie banner alone is shorter). A bot wall is never done,
since a real browser often passes it given time. On timeout the fullest clean
snapshot wins, then the fullest of any kind.

## Why

One persistent partition keeps anti-bot clearance cookies, so repeat visits
look like one returning client. Callers own the upper bound of the settle time
(the lookup caps its timeout at 45 s, the live API at its own limit); the tab
only enforces the minimum a page needs to show it has settled.
