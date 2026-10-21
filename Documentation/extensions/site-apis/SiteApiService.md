# SiteApiService

`extensions/site-apis/SiteApiService.js`

The public API of the extension: the one object `routes.js`, `mcp-tools.js`, the IPC handlers and the builder
mode call. Wraps the store, runs endpoints through the runner, re-registers the `siteapi_*` tools after a
definition changes, broadcasts `changed { what, id }`, and brings a site's persisted tab to the front.

## Methods

- Sites: `listSites()` (each with `endpoints` summaries carrying `toolName` and `usesLlm`), `getSite`, `createSite`,
  `updateSite`, `deleteSite`.
- Endpoints: `listEndpoints(siteId?)`, `getEndpoint`, `getEndpointByName`, `createEndpoint`, `updateEndpoint`,
  `deleteEndpoint`.
- Runs: `run(siteId, endpointName, params, { kind, signal })` answers the runner's RunResult, or an
  `unknown_endpoint` fault result (never a throw); `listRuns(endpointId, limit)`, `getRun(id)`.
- Tabs: `showSiteTab(siteId)` finds the persisted tab whose partition and origin match the site
  (`persistedTabFor(tabViewManager, site)`) and shows it.
- `faultResult(fault)` is the `{ success: false, fault, advice }` shape every surface reports.
