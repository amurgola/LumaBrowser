# Site APIs: design and module contract

Site APIs turns a signed-in persisted tab into named endpoints. An endpoint is a recorded step script with
parameters; calling it replays the script in a hidden tab that shares the persisted tab's session partition and
returns JSON. Each selector-bearing step stores both a CSS selector and a plain-language description, so replay
is deterministic until the site drifts, then recovers through the core LLM fallback and rewrites the selector.
Endpoints are exposed as `siteapi_<site>_<endpoint>` MCP tools (and so chat tools) and `/api/site-apis` routes.

## Records

Site (`SiteApiStore.getSite`): `{ id, name, origin, partition, startUrl, login, status, statusNote, conversationId }`.
`login` is `{ required, signInUrlPatterns: [string], signedInSelector, signedOutSelector }`; a pattern is a
substring of the URL, or a regular expression when written as `/.../`. `status` is `ok`, `signed_out` or `unknown`.
The site is identified by `partition` plus `origin`; that pair is how the persisted tab is found again
(`SiteApiService.persistedTabFor`).

Endpoint (`SiteApiStore.getEndpoint`): `{ id, siteId, name, description, params, steps, returns, policy, status, lastRun }`.
`status` is `draft`, `validated` or `broken`. `spec/EndpointSpec.normalize` validates the whole definition on every
write; every `{{placeholder}}` in a step must name a declared param.

Run (`SiteApiStore.getRun`): `{ id, endpointId, siteId, kind: 'call' | 'test', params, status: 'running' | 'ok' | 'failed', fault, result, stepsLog, durationMs }`.

## Params

`params: [{ name, type: 'string' | 'number' | 'boolean', required, description, default?, example? }]`.
`spec/ParamTemplate.resolve(params, input)` validates and coerces a call; `render(value, values, { encode })`
fills `{{name}}` placeholders (recursively through arrays and objects). `{{name|url}}` URL-encodes,
`{{name|raw}}` never does. The runner renders a navigate step's `url` with `encode: true` and everything else
with `encode: false`. `inputSchema(params)` is the JSON schema the MCP tool advertises.

## Steps

`spec/StepKinds.CATALOG` is the catalog. Every step may carry `selector`, `description`, `note`, `optional`
(a failed optional step does not fail the run) and `timeoutMs`. Targeted kinds (`click`, `type`, `select`,
`read`, `extract`, `table`) need a selector or a description; `press_key`, `scroll` and `wait` may have one.

| kind | fields | effect |
| --- | --- | --- |
| navigate | url, waitMs? | load the URL (placeholders URL-encoded), wait for load and settle |
| click | text? | click the element |
| type | text, submit?, clear? | type into the element, optionally press Enter |
| press_key | key | press a key on the element or the page |
| select | option | choose a select option |
| scroll | direction?, amount?, times? | scroll the element or the page |
| wait | text?, state?, timeoutMs? | wait for an element or text to be visible, hidden or present |
| settle | quietMs?, maxMs? | wait for the DOM to go quiet |
| read | as, attribute?, all? | one element's text (or attribute) into `result[as]`, or the whole result when `as` is `$` |
| extract | childSelectors, as?, maxRows?, preferTableStructure? | rows: the row selector plus field selectors relative to each row |
| table | rowSelector?, cellSelector?, as? | a table's rows keyed by header |
| transform | op and its fields | deterministic reshaping of the current result (see below) |
| llm_transform | instruction, returns? | the LLM rewrites the current result JSON per the instruction (flagged as non-deterministic) |

Transform ops: `sort { by, order: 'asc' | 'desc', numeric? }`, `filter { field, filterOp, value }` (filterOp from
`StepKinds.FILTER_OPS`, default `eq`), `limit { count }`, `pick { fields }`, `first`, `parse_number { fields }`
(strips currency symbols and thousands separators), `rename { map }`, `flatten { path }`.

The current result: the last producer step (`read`, `extract`, `table`, `transform`, `llm_transform`) sets it.
`read` with `as` other than `$` merges into an object; `extract` and `table` replace it with rows.

## Returns and policy

`returns: { kind: 'rows' | 'object' | 'value' | 'text', fields?, description? }`. The runner checks the final
result against `kind` and, for rows, that every declared field is present on at least one row; a mismatch is
the `shape_mismatch` fault.

`policy: { attempts, backoffMs, allowLlmFallback, stepTimeoutMs, recoveryTimeoutMs, totalTimeoutMs }`, defaults in
`EndpointSpec.DEFAULT_POLICY`. A targeted step gets `stepTimeoutMs` for its stored selector plus
`recoveryTimeoutMs` for recovery through its description (a local model's first load is slow). Retries apply
only to faults with `retryable: true` (`spec/Faults.RETRYABLE`).

## Faults

`spec/Faults.make(code, message, { step, detail })` gives `{ code, message, retryable, step?, detail? }`.
Codes: `invalid_params`, `unknown_endpoint`, `browser_unavailable`, `site_unavailable`, `needs_login`,
`interstitial`, `step_failed`, `timeout`, `shape_mismatch`, `aborted`. `Faults.advice(fault)` is the one-line
"what to do" every surface appends.

## Runner contract (`runtime/EndpointRunner`)

```
new EndpointRunner({ store, browser, chat, logger, onSiteStatus(siteId, status, note), showSiteTab(siteId) })
await runner.run(site, endpoint, params, { kind: 'call' | 'test', signal })
  -> RunResult { success, data, runId, durationMs, fault?, advice?, healed: [{ step, selector }], stepsLog: [{ index, kind, ok, ms, via, note? }] }
runner.dispose()
```

The runner: resolves params (`invalid_params`); starts a run row; acquires one hidden tab per site partition
(`runtime/SiteTab`: created with `browser.createTab(site.startUrl, { partition: site.partition, hidden: true, activate: false })`
or `silent: true` if input works in silent tabs, reused across calls, one call at a time per site); runs the steps;
after every navigation checks the sign-in patterns and the signed-in / signed-out selectors (`needs_login`:
mark the site `signed_out` through `onSiteStatus`, raise a desktop notification whose click calls
`showSiteTab`); on a targeted step runs the stored selector first, then, if `policy.allowLlmFallback`, the core
`SelectorFallback` with the description (`core/browser/controller/SelectorFallback.js`; the `service` it wants is
the `LlmFallbackService` the app publishes, see `core/browser/LlmFallbackOrchestrator.js` and
`app/browser/AutomationServices.js`); a recovered selector is written back to the step (`healed`) and the endpoint
saved; applies the retry policy; checks the returns shape; finishes the run row; answers the RunResult.

## Tool host contract (`exposure/SiteApiToolHost`)

```
new SiteApiToolHost({ store, run(siteId, endpointName, params, opts), getAggregator, logger })
toolHost.refresh()   // re-registers the live siteapi_* set: aggregator.registerExtension('site-apis-endpoints', { tools, handler })
toolHost.dispose()   // unregisters
```

Tool name: `spec/ToolNames.endpointTool(site, endpoint)`. Input schema: `ParamTemplate.inputSchema(endpoint.params)`.
Description: the endpoint description plus the site name and the returns shape. The handler answers the MCP
envelope with `data` on success or the fault and advice on failure. Only `validated` endpoints are registered.

`exposure/SiteApiManagementTools` (fixed, from mcp-tools.js): `site_apis_list`, `site_apis_run { site, endpoint, params }`,
`site_apis_show_tab { site }`.

## Builder contract (`builder/SiteApiBuilderMode`)

```
new SiteApiBuilderMode({ service, browser, getChatStore, logger })
builder.descriptor()   // chat mode: id 'site-api-builder', launcher 'sidebar', agent true, buildTurn
builder.dispose()
```

The conversation's meta data holds `{ siteId, workTabId }`. `buildTurn` pins the agent to a work tab opened in
the site's partition (`workTabId`), allows the page tools plus the builder tools, and injects the builder prompt
(the site, its endpoints, the step catalog, and the demonstrate-compile-test-save flow). Builder tools:
`define_site`, `define_endpoint` (name, description, params), `compile_endpoint` (turns the browser tool calls
the model made in this conversation since the endpoint was defined into steps, stores a draft, returns the
steps), `set_steps` (replace the steps JSON directly), `test_endpoint` (runs it with given params through the
service, kind `test`), `save_endpoint` (marks it `validated`, which registers the tool). The renderer opens a
builder conversation from the tab's context menu with the site's partition and origin in the meta.

## Surfaces

- REST (`routes.js`, prefix `/api/site-apis`): `GET /sites`, `GET /sites/:site`, `DELETE /sites/:site`,
  `GET /sites/:site/endpoints`, `GET /sites/:site/endpoints/:name`, `DELETE /sites/:site/endpoints/:name`,
  `POST /sites/:site/endpoints/:name/run` (body: params; 200 with the RunResult, 422 on a fault with the fault
  body), `GET /runs/:id`, `POST /sites/:site/show-tab`.
- IPC (`exposure/SiteApiIpcHandlers`, namespace `ext.site-apis`): `listSites`, `getEndpoint`, `deleteSite`,
  `deleteEndpoint`, `run`, `listRuns`, `showSiteTab`, `openBuilder`; the extension broadcasts
  `ext.site-apis.changed { what, id }`.
- Settings page (`settings.html`, `ui/`): sites with status, their endpoints with tool name, last run and
  status, Run now with a params form, Open tab, Delete, and "New site API" (opens the builder).
- Tab context menu (`renderer.js`): "Create Site API from this tab" on a persisted tab.

## Conventions

Every code file has `Documentation/<same path>.md` and a line in `Documentation/index.md`. No dash characters other than the hyphen in any file.
