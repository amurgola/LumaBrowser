# BrowserController

`core/browser/BrowserController.js`

REST controller behind `/api/browser`, mounted by [BrowserRoutes](BrowserRoutes.md). Each handler
validates the request, calls the tab manager and replies with an [ApiResponse](models/ApiResponse.md)
envelope. It holds no logic of its own: parsing is [BrowserRequestParser](controller/BrowserRequestParser.md),
selector fallback is [SelectorFallback](controller/SelectorFallback.md) shaped by
[RestFallbackReply](controller/RestFallbackReply.md).

## Methods

- `new BrowserController(tabManager, networkInterceptor?, llmFallbackService?)`. `tabManager` is the
  tab manager facade (legacy TabManager API names).
- Handlers, all `(req, res)`, one per `BrowserActions` REST entry:

| Handler | Route | Tab manager call | Failure status |
|---|---|---|---|
| `getAllTabs` | GET /tabs?includeSilent | `getAllTabs({ includeSilent })` | 500 |
| `getTabSource` | GET /tabs/:id/source?type | `getTabSource(id, { type = 'clean' })` | 404 |
| `createTab` | POST /tabs { url, silent } | `createTab(url, { silent })`, 201 | 400 (url), 500 |
| `closeTab` | DELETE /tabs/:id | `closeTab(id)` | 404 |
| `activateTab` | POST /tabs/:id/activate | `updateTab(id, { type: 'activate' })` | 400 |
| `updateTab` | PATCH /tabs/:id | `updateTab(id, action)` | 400 (body), 404 |
| `screenshotTab` | GET /tabs/:id/screenshot | `screenshotTab(id, options)` | 404 |
| `getConsoleLogs` | GET /tabs/:id/console?level | `getConsoleLogs(id, options)` | 404 |
| `clickAt` | POST /tabs/:id/click-at | `clickAt(id, { x, y, button, clickCount })` | 400 |
| `clickElement` | POST /tabs/:id/click | `clickElement(id, { selector, text })` + fallback | 404 |
| `fillForm` | POST /tabs/:id/fill | `fillForm(id, { fields })` + per-field fallback | 404 |
| `waitForElement` | POST /tabs/:id/wait | `waitForElement(id, { selector, text, state, timeout })` + fallback | 408 |
| `getNetworkLog` | GET /tabs/:id/network?url | `networkInterceptor.getRequestLog(id)` | 500 (no interceptor) |
| `scrollPage` | POST /tabs/:id/scroll | `scrollPage(id, { selector, direction, amount })`, fallback only with a selector | 404 |
| `getTable` | GET /tabs/:id/table | `getTable(id, options)`, fallback only with a selector | 404 |
| `pressKey` | POST /tabs/:id/press-key | `pressKey(id, { key, selector })`, fallback only with a selector | 404 |
| `handleDialog` | POST /tabs/:id/dialog | `handleDialog(id, { action, promptText })` | 404 |
| `getElement` | GET /tabs/:id/element | `getElement(id, { selector, text })` + fallback | 404 |
| `extractData` | POST /tabs/:id/extract-data | `extractData(id, { baseSelector, childSelectors })` | 404 |

A bad tab id is a 400 (`Invalid tab ID`), a throw anywhere a 500 (`Internal server error`). Navigating
clicks (`clickElement`, `clickAt`) carry `urlChanged` and `newUrl` via
[NavigationStamp](controller/NavigationStamp.md). Fallback replies say `(resolved by LLM)` when the
description stood in for a missing selector and `(resolved by LLM fallback)` when it rescued a failed one.

`BrowserController.FALLBACK_REPLIES` holds the per-action wording; `SELECTOR_REQUIRED` the shared 400.
